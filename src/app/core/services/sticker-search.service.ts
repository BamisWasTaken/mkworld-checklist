import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import checklistData from '../../../../public/data/checklist-data.json';
import { CONSTANTS } from '../../constants';
import { ChecklistModel } from '../models';

const STICKER_TRANSLATION_PREFIX = 'STICKERS.';

@Injectable({
  providedIn: 'root',
})
export class StickerSearchService {
  private readonly translateService = inject(TranslateService);
  private readonly translateStore = inject(TranslateStore);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Searchable text never changes, only the checked state does. Reading the static seed data
   * instead of the checklist signal keeps the haystack from rebuilding on every sticker check.
   */
  private readonly searchableChecklistModels = (checklistData as ChecklistModel[]).filter(
    (checklistModel: ChecklistModel) => checklistModel.hasSticker
  );

  private readonly rawSearchTerm = signal('');
  private readonly searchTerm = signal('');

  private searchTermTimeout: number | null = null;

  private readonly searchableTextByIndex = computed<ReadonlyMap<number, string>>(() => {
    this.translateStore.translations();
    this.translateService.currentLang();

    const searchableTextByIndex = new Map<number, string>();
    for (const checklistModel of this.searchableChecklistModels) {
      const searchableText = [
        checklistModel.stickerAltText,
        checklistModel.instructions,
        checklistModel.collectibleModel?.missionName,
      ]
        .filter((key: string | undefined): key is string => !!key)
        .map((key: string) => this.translateKey(key))
        .filter((text: string | null): text is string => text !== null);

      if (searchableText.length > 0) {
        searchableTextByIndex.set(checklistModel.index, searchableText.join(' ').toLowerCase());
      }
    }
    return searchableTextByIndex;
  });

  /**
   * `null` means no search is active, an empty set means the search matched nothing.
   */
  private readonly matchingIndexes = computed<ReadonlySet<number> | null>(() => {
    const searchTerm = this.searchTerm();
    if (!searchTerm) {
      return null;
    }

    const matchingIndexes = new Set<number>();
    for (const [index, searchableText] of this.searchableTextByIndex()) {
      if (searchableText.includes(searchTerm)) {
        matchingIndexes.add(index);
      }
    }
    return matchingIndexes;
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelPendingSearchTerm());
  }

  getRawSearchTerm(): Signal<string> {
    return this.rawSearchTerm.asReadonly();
  }

  getSearchTerm(): Signal<string> {
    return this.searchTerm.asReadonly();
  }

  getMatchingIndexes(): Signal<ReadonlySet<number> | null> {
    return this.matchingIndexes;
  }

  setSearchTerm(searchTerm: string): void {
    this.rawSearchTerm.set(searchTerm);
    this.cancelPendingSearchTerm();
    this.searchTermTimeout = window.setTimeout(() => {
      this.searchTermTimeout = null;
      this.searchTerm.set(normalizeSearchTerm(searchTerm));
    }, CONSTANTS.STICKER_SEARCH_DEBOUNCE_TIME);
  }

  clearSearchTerm(): void {
    this.cancelPendingSearchTerm();
    this.rawSearchTerm.set('');
    this.searchTerm.set('');
  }

  private cancelPendingSearchTerm(): void {
    if (this.searchTermTimeout) {
      clearTimeout(this.searchTermTimeout);
      this.searchTermTimeout = null;
    }
  }

  /**
   * Returns `null` for keys without a translation, so raw i18n keys never end up in the haystack.
   */
  private translateKey(key: string): string | null {
    const fullKey = STICKER_TRANSLATION_PREFIX + key;
    const text = this.translateService.instant(fullKey);
    return typeof text === 'string' && text !== fullKey ? text : null;
  }
}

function normalizeSearchTerm(searchTerm: string): string {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  return normalizedSearchTerm.length >= CONSTANTS.STICKER_SEARCH_MIN_LENGTH
    ? normalizedSearchTerm
    : '';
}
