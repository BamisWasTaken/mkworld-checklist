import { computed, ElementRef, inject, Injectable, Signal, signal } from '@angular/core';
import { PanZoom } from 'panzoom';
import { CONSTANTS } from '../../constants';
import { ChecklistModel, CollectibleModel } from '../../core/models';
import { ChecklistDataService } from '../../core/services';
import { Bounds, QuadTreeNode, TooltipPosition } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MapSectionService {
  private readonly checklistDataService = inject(ChecklistDataService);

  private quadTree = this.initializeQuadTree();

  private readonly collectibleChecklistModels =
    this.checklistDataService.getCollectibleChecklistModelsOnMap();
  private readonly visibleCollectibleIndexes = signal<number[]>([]);
  private readonly visibleCollectibleChecklistModels = computed(() => {
    if (this.collectibleChecklistModels().length > CONSTANTS.QUAD_TREE_THRESHOLD) {
      return this.collectibleChecklistModels().filter((checklistModel: ChecklistModel) =>
        this.visibleCollectibleIndexes().includes(checklistModel.index)
      );
    }
    return this.collectibleChecklistModels();
  });

  private mapPanzoomWidth: number | null = null;
  private mapPanzoomHeight: number | null = null;

  private updateVisibleCollectiblesTimeout: number | null = null;

  getVisibleCollectibleChecklistModels(): Signal<ChecklistModel[]> {
    return this.visibleCollectibleChecklistModels;
  }

  debouncedUpdateVisibleCollectibles(
    mapPanzoomRef: ElementRef,
    mapSectionRef: ElementRef,
    pzInstance: PanZoom
  ): void {
    if (this.collectibleChecklistModels().length > CONSTANTS.QUAD_TREE_THRESHOLD) {
      if (this.updateVisibleCollectiblesTimeout) {
        clearTimeout(this.updateVisibleCollectiblesTimeout);
      }

      this.updateVisibleCollectiblesTimeout = window.setTimeout(() => {
        this.updateVisibleCollectibleIndexes(mapPanzoomRef, mapSectionRef, pzInstance);
        this.updateVisibleCollectiblesTimeout = null;
      }, CONSTANTS.QUAD_TREE_DEBOUNCE_TIME);
    }
  }

  updateVisibleCollectibleIndexes(
    mapPanzoomRef: ElementRef,
    mapSectionRef: ElementRef,
    pzInstance: PanZoom
  ): void {
    const visibleBounds = this.calculateVisibleBounds(mapPanzoomRef, mapSectionRef, pzInstance);
    const visibleCollectibleIndexes = this.quadTree
      .retrieve(visibleBounds)
      .map((checklistModel: ChecklistModel) => checklistModel.index);

    this.visibleCollectibleIndexes.set(visibleCollectibleIndexes);
  }

  calculateTooltipPosition(
    mapPanzoomRef: ElementRef,
    mapSectionRef: ElementRef,
    pzInstance: PanZoom,
    collectibleModel?: CollectibleModel
  ): TooltipPosition {
    if (!collectibleModel) {
      return TooltipPosition.ABOVE;
    }

    const visibleBounds = this.calculateVisibleBounds(mapPanzoomRef, mapSectionRef, pzInstance);

    // Calculate available space in each direction
    const spaceAbove = collectibleModel.yPercentage - visibleBounds.y;
    const spaceBelow = visibleBounds.y + visibleBounds.height - collectibleModel.yPercentage;
    const spaceLeft = collectibleModel.xPercentage - visibleBounds.x;
    const spaceRight = visibleBounds.x + visibleBounds.width - collectibleModel.xPercentage;

    // Final fallback: choose the position with the most available space
    const spaceScores = [
      { position: TooltipPosition.ABOVE, score: Math.min(spaceAbove, spaceLeft, spaceRight) },
      { position: TooltipPosition.BELOW, score: Math.min(spaceBelow, spaceLeft, spaceRight) },
      { position: TooltipPosition.LEFT, score: Math.min(spaceLeft, spaceAbove, spaceBelow) },
      { position: TooltipPosition.RIGHT, score: Math.min(spaceRight, spaceAbove, spaceBelow) },
    ];

    const bestPosition = spaceScores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return bestPosition.position;
  }

  cleanup(pzInstance: PanZoom | null): void {
    if (this.updateVisibleCollectiblesTimeout) {
      clearTimeout(this.updateVisibleCollectiblesTimeout);
    }
    if (pzInstance) {
      pzInstance.dispose();
    }
  }

  private calculateVisibleBounds(
    mapPanzoomRef: ElementRef,
    mapSectionRef: ElementRef,
    pzInstance: PanZoom
  ): Bounds {
    const mapSectionRect = mapSectionRef.nativeElement.getBoundingClientRect();
    const panTransform = pzInstance?.getTransform() ?? { scale: 1, x: 0, y: 0 };

    if (!this.mapPanzoomWidth && !this.mapPanzoomHeight) {
      const mapRect = mapPanzoomRef.nativeElement.getBoundingClientRect();
      this.mapPanzoomWidth = mapRect.width / panTransform.scale;
      this.mapPanzoomHeight = mapRect.height / panTransform.scale;
    }

    const mapSectionWidth = mapSectionRect.width;
    const mapSectionHeight = mapSectionRect.height;

    const visibleLeft = -panTransform.x / panTransform.scale;
    const visibleTop = -panTransform.y / panTransform.scale;
    const visibleRight = visibleLeft + mapSectionWidth / panTransform.scale;
    const visibleBottom = visibleTop + mapSectionHeight / panTransform.scale;

    const x =
      Math.max(0, (visibleLeft / this.mapPanzoomWidth!) * 100) - CONSTANTS.QUAD_TREE_VISIBLE_BUFFER;
    const y =
      Math.max(0, (visibleTop / this.mapPanzoomHeight!) * 100) - CONSTANTS.QUAD_TREE_VISIBLE_BUFFER;
    const width =
      Math.min(100 - x, ((visibleRight - visibleLeft) / this.mapPanzoomWidth!) * 100) +
      2 * CONSTANTS.QUAD_TREE_VISIBLE_BUFFER;
    const height =
      Math.min(100 - y, ((visibleBottom - visibleTop) / this.mapPanzoomHeight!) * 100) +
      2 * CONSTANTS.QUAD_TREE_VISIBLE_BUFFER;

    return { x, y, width, height } as Bounds;
  }

  private initializeQuadTree(): QuadTreeNode {
    const collectibles = this.checklistDataService
      .getChecklistModels()()
      .filter((checklistModel: ChecklistModel) => checklistModel.collectibleModel);

    const quadtree = new QuadTreeNode({ x: 0, y: 0, width: 100, height: 100 });

    for (const collectible of collectibles) {
      quadtree.insert(collectible);
    }

    return quadtree;
  }
}
