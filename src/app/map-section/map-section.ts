import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, PLATFORM_ID, viewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import panzoom, { PanZoom } from 'panzoom';

@Component({
  selector: 'mkworld-map-section',
  templateUrl: './map-section.html',
  styleUrls: ['./map-section.css'],
  imports: [TranslateModule]
})
export class MapSection implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  
  readonly mapPanzoomRef = viewChild<ElementRef<HTMLDivElement>>('mapPanzoom');
  
  private pzInstance: PanZoom | null = null;
  protected isPanning = false;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.pzInstance = panzoom(this.mapPanzoomRef()!.nativeElement, {
        bounds: true,
        boundsPadding: 1,
        minZoom: 1,
        maxZoom: 5,
      });

      this.pzInstance.on('panstart', () => this.isPanning = true);
      this.pzInstance.on('panend', () => this.isPanning = false);
    }
  }

  ngOnDestroy(): void {
    if (this.pzInstance) {
      this.pzInstance.dispose();
    }
  }
}
