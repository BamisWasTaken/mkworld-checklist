import { ChecklistModel } from '../../app/core/models';

export function createChecklistModel(overrides: Partial<ChecklistModel> = {}): ChecklistModel {
  return {
    index: 0,
    checked: false,
    disappearingFromStickerAlbum: false,
    disappearingFromMap: false,
    hasSticker: true,
    instructions: 'TEST.INSTRUCTIONS',
    stickerAltText: 'TEST_ALT',
    description: 'TEST.DESCRIPTION',
    ...overrides,
  };
}
