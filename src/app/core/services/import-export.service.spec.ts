import { TestBed } from '@angular/core/testing';
import { CollectibleType, Map, QuickAction, SaveFile } from '../models';
import { AchievementDataService } from './achievement-data.service';
import { ChecklistDataService } from './checklist-data.service';
import { ImportExportService } from './import-export.service';
import { SettingsService } from './settings.service';

describe('ImportExportService', () => {
  let service: ImportExportService;
  let checklistDataService: ChecklistDataService;
  let achievementDataService: AchievementDataService;
  let settingsService: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportExportService);
    checklistDataService = TestBed.inject(ChecklistDataService);
    achievementDataService = TestBed.inject(AchievementDataService);
    settingsService = TestBed.inject(SettingsService);
  });

  it('should export a SaveFile-shaped JSON download', async () => {
    const blobs: Blob[] = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation((obj: Blob | MediaSource) => {
      blobs.push(obj as Blob);
      return 'blob:test';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    checklistDataService.updateChecklistModelChecked(
      checklistDataService.getChecklistModels()()[0]
    );
    settingsService.setMap(Map.INGAME_MAP);

    service.exportSaveFile();

    expect(blobs.length).toBe(1);
    const saveFile = JSON.parse(await blobs[0].text()) as SaveFile;
    expect(saveFile.checklistModelStates[0].checked).toBe(true);
    expect(saveFile.achievementStates.length).toBeGreaterThan(0);
    expect(saveFile.settings.map).toBe(Map.INGAME_MAP);
    expect(saveFile.settings.showCollectedStickers).toBe(true);
  });

  it('should import checklist, achievements, and settings', () => {
    const stickerIndex = checklistDataService.getChecklistModels()()[0].index;
    const achievementIndex = achievementDataService.getAchievements()()[0].index;

    service.importSaveFile({
      checklistModelStates: [{ index: stickerIndex, checked: true }],
      achievementStates: [{ index: achievementIndex, milestoneReached: 2, expanded: true }],
      settings: {
        showCollectedStickers: false,
        showCollectedCollectibles: true,
        shownCollectibleTypes: [CollectibleType.P_SWITCH],
        map: Map.INGAME_MAP,
      },
    });

    expect(checklistDataService.getChecklistModels()()[0].checked).toBe(true);
    expect(achievementDataService.getAchievements()()[0].milestoneReached).toBe(2);
    expect(settingsService.shouldShowCollectedStickers()()).toBe(false);
    expect(settingsService.getMap()()).toBe(Map.INGAME_MAP);
  });

  it('should round-trip checked progress through export then import', async () => {
    const blobs: Blob[] = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation((obj: Blob | MediaSource) => {
      blobs.push(obj as Blob);
      return 'blob:test';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    checklistDataService.performQuickAction(QuickAction.CHECK_ALL_P_SWITCHES);
    service.exportSaveFile();
    checklistDataService.performQuickAction(QuickAction.RESET);

    const saveFile = JSON.parse(await blobs[0].text()) as SaveFile;
    service.importSaveFile(saveFile);

    expect(
      checklistDataService
        .getChecklistModels()()
        .filter(item => item.collectibleModel?.collectibleType === CollectibleType.P_SWITCH)
        .every(item => item.checked)
    ).toBe(true);
  });
});
