import { inject, Injectable } from '@angular/core';
import {
  Achievement,
  AchievementState,
  ChecklistModel,
  ChecklistModelState,
  SaveFile,
  Settings,
} from '../models';
import { AchievementDataService } from './achievement-data.service';
import { ChecklistDataService } from './checklist-data.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class ImportExportService {
  private readonly checklistDataService = inject(ChecklistDataService);
  private readonly achievementDataService = inject(AchievementDataService);
  private readonly settingsService = inject(SettingsService);

  exportSaveFile(): void {
    const checklistModels = this.checklistDataService.getChecklistModels()();
    const checklistModelStates = checklistModels.map((checklistModel: ChecklistModel) => ({
      index: checklistModel.index,
      checked: checklistModel.checked,
    })) as ChecklistModelState[];

    const achievements = this.achievementDataService.getAchievements()();
    const achievementStates = achievements.map((achievement: Achievement) => ({
      index: achievement.index,
      milestoneReached: achievement.milestoneReached,
      expanded: achievement.expanded,
    })) as AchievementState[];

    const settings: Settings = {
      showCollectedStickers: this.settingsService.shouldShowCollectedStickers()(),
      showCollectedCollectibles: this.settingsService.shouldShowCollectedCollectibles()(),
      shownCollectibleTypes: this.settingsService.getShownCollectibleTypes()(),
    };

    const saveFile: SaveFile = {
      checklistModelStates,
      achievementStates,
      settings,
    };

    const jsonString = JSON.stringify(saveFile, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mkworld-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  importSaveFile(saveFile: SaveFile): void {
    this.checklistDataService.importChecklistModels(saveFile.checklistModelStates);
    this.achievementDataService.importAchievements(saveFile.achievementStates);
    this.settingsService.importSettings(saveFile.settings);
  }
}
