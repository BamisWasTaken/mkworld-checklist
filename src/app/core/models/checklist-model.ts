import { CollectibleModel } from './collectible-model';

export interface ChecklistModel {
  index: number;
  checked: boolean;
  disappearingFromStickerAlbum: boolean;
  disappearingFromMap: boolean;
  description?: string;
  instructions: string;
  hasSticker: boolean;
  stickerAltText?: string;
  collectibleModel?: CollectibleModel;
}
