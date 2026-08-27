import { CollectibleModel, CollectibleType } from '../../app/core/models';

export function createCollectibleModel(
  overrides: Partial<CollectibleModel> = {}
): CollectibleModel {
  return {
    collectibleType: CollectibleType.P_SWITCH,
    xPercentage: 50,
    yPercentage: 50,
    ...overrides,
  };
}
