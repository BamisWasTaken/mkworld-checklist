import { ChecklistModel, CollectibleModel } from '../../app/core/models';
import { createChecklistModel } from './create-checklist-model';
import { createCollectibleModel } from './create-collectible-model';

export function createCollectibleChecklist(
  overrides: Partial<ChecklistModel> = {},
  collectibleOverrides: Partial<CollectibleModel> = {}
): ChecklistModel {
  return createChecklistModel({
    collectibleModel: createCollectibleModel(collectibleOverrides),
    ...overrides,
  });
}
