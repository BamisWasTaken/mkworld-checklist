import { AchievementState } from './achievement-state';
import { ChecklistModelState } from './checklist-model-state';
import { Settings } from './settings';

export interface SaveFile {
  achievementStates: AchievementState[];
  checklistModelStates: ChecklistModelState[];
  settings: Settings;
}
