import { CollectibleModel } from './collectible-model';

export interface ChecklistModel {
  index: number;
  checked: boolean;
  disappearing: boolean;
  description?: string;
  instructions: string;
  hasSticker: boolean;
  stickerAltText?: string;
  collectibleModel?: CollectibleModel;
}
