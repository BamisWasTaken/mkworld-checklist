import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import checklistData from '../../../../public/data/checklist-data.json';
import { CONSTANTS } from '../../constants';
import { waitMs } from '../../../testing/async';
import { ChecklistModel } from '../models';
import { StickerSearchService } from './sticker-search.service';

const UNIQUE_TOKEN = 'zzuniquetoken';
const DEBOUNCE_WAIT = CONSTANTS.STICKER_SEARCH_DEBOUNCE_TIME + 50;

describe('StickerSearchService', () => {
  let service: StickerSearchService;
  let translateService: TranslateService;

  const stickers = (checklistData as ChecklistModel[]).filter(
    (checklistModel: ChecklistModel) => checklistModel.hasSticker
  );

  function findSticker(predicate: (checklistModel: ChecklistModel) => boolean): ChecklistModel {
    const checklistModel = stickers.find(predicate);
    expect(checklistModel).toBeDefined();
    return checklistModel!;
  }

  /**
   * The test translate service has no loader, so `instant()` falls back to `en` without `use()`.
   */
  function seedTranslations(translations: Record<string, string>): void {
    translateService.setTranslation('en', { STICKERS: translations });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StickerSearchService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should not be searching initially', () => {
    expect(service.getSearchTerm()()).toBe('');
    expect(service.getMatchingIndexes()()).toBeNull();
  });

  it('should ignore terms shorter than the minimum length', async () => {
    service.setSearchTerm('ab');
    await waitMs(DEBOUNCE_WAIT);

    expect(service.getMatchingIndexes()()).toBeNull();
  });

  it('should not apply the term before the debounce elapses', async () => {
    service.setSearchTerm(UNIQUE_TOKEN);
    await waitMs(CONSTANTS.STICKER_SEARCH_DEBOUNCE_TIME / 2);
    expect(service.getSearchTerm()()).toBe('');

    await waitMs(CONSTANTS.STICKER_SEARCH_DEBOUNCE_TIME / 2);
    expect(service.getSearchTerm()()).toBe(UNIQUE_TOKEN);
  });

  it('should collapse rapid keystrokes into the last term', async () => {
    const lastTerm = 'zzuni';
    service.setSearchTerm('zzu');
    service.setSearchTerm('zzun');
    service.setSearchTerm(lastTerm);
    await waitMs(DEBOUNCE_WAIT);

    expect(service.getSearchTerm()()).toBe(lastTerm);
  });

  it('should track the raw term immediately', () => {
    service.setSearchTerm('zz');

    expect(service.getRawSearchTerm()()).toBe('zz');
    expect(service.getSearchTerm()()).toBe('');
  });

  it('should match the translated sticker alt text', async () => {
    const sticker = findSticker(
      (checklistModel: ChecklistModel) => !!checklistModel.stickerAltText
    );
    seedTranslations({ [sticker.stickerAltText!]: UNIQUE_TOKEN });

    service.setSearchTerm(UNIQUE_TOKEN);
    await waitMs(DEBOUNCE_WAIT);

    expect([...service.getMatchingIndexes()()!]).toEqual([sticker.index]);
  });

  it('should match the translated instructions', async () => {
    const sticker = findSticker((checklistModel: ChecklistModel) =>
      stickers.every(
        (other: ChecklistModel) =>
          other.index === checklistModel.index || other.instructions !== checklistModel.instructions
      )
    );
    seedTranslations({ [sticker.instructions]: UNIQUE_TOKEN });

    service.setSearchTerm(UNIQUE_TOKEN);
    await waitMs(DEBOUNCE_WAIT);

    expect([...service.getMatchingIndexes()()!]).toEqual([sticker.index]);
  });

  it('should match the translated mission name', async () => {
    const sticker = findSticker(
      (checklistModel: ChecklistModel) => !!checklistModel.collectibleModel?.missionName
    );
    seedTranslations({ [sticker.collectibleModel!.missionName!]: UNIQUE_TOKEN });

    service.setSearchTerm(UNIQUE_TOKEN);
    await waitMs(DEBOUNCE_WAIT);

    expect([...service.getMatchingIndexes()()!]).toEqual([sticker.index]);
  });

  it('should trim and lowercase the term', async () => {
    const sticker = findSticker(
      (checklistModel: ChecklistModel) => !!checklistModel.stickerAltText
    );
    seedTranslations({ [sticker.stickerAltText!]: UNIQUE_TOKEN });

    service.setSearchTerm(`  ${UNIQUE_TOKEN.toUpperCase()}  `);
    await waitMs(DEBOUNCE_WAIT);

    expect(service.getSearchTerm()()).toBe(UNIQUE_TOKEN);
    expect([...service.getMatchingIndexes()()!]).toEqual([sticker.index]);
  });

  it('should return an empty set when nothing matches', async () => {
    service.setSearchTerm(UNIQUE_TOKEN);
    await waitMs(DEBOUNCE_WAIT);

    const matchingIndexes = service.getMatchingIndexes()();
    expect(matchingIndexes).not.toBeNull();
    expect(matchingIndexes!.size).toBe(0);
  });

  it('should never match untranslated i18n keys', async () => {
    service.setSearchTerm('alt_text');
    await waitMs(DEBOUNCE_WAIT);

    expect(service.getMatchingIndexes()()!.size).toBe(0);
  });

  it('should clear the term synchronously', async () => {
    const sticker = findSticker(
      (checklistModel: ChecklistModel) => !!checklistModel.stickerAltText
    );
    seedTranslations({ [sticker.stickerAltText!]: UNIQUE_TOKEN });
    service.setSearchTerm(UNIQUE_TOKEN);
    await waitMs(DEBOUNCE_WAIT);

    service.clearSearchTerm();

    expect(service.getRawSearchTerm()()).toBe('');
    expect(service.getSearchTerm()()).toBe('');
    expect(service.getMatchingIndexes()()).toBeNull();
  });

  it('should discard a pending term when cleared', async () => {
    service.setSearchTerm(UNIQUE_TOKEN);
    service.clearSearchTerm();
    await waitMs(DEBOUNCE_WAIT);

    expect(service.getSearchTerm()()).toBe('');
  });

  it('should rebuild the haystack when translations change', async () => {
    const sticker = findSticker(
      (checklistModel: ChecklistModel) => !!checklistModel.stickerAltText
    );
    service.setSearchTerm(UNIQUE_TOKEN);
    await waitMs(DEBOUNCE_WAIT);
    expect(service.getMatchingIndexes()()!.size).toBe(0);

    seedTranslations({ [sticker.stickerAltText!]: UNIQUE_TOKEN });

    expect([...service.getMatchingIndexes()()!]).toEqual([sticker.index]);
  });

  it('should not persist the term to local storage', async () => {
    service.setSearchTerm(UNIQUE_TOKEN);
    await waitMs(DEBOUNCE_WAIT);

    expect(JSON.stringify(localStorage)).not.toContain(UNIQUE_TOKEN);
  });
});
