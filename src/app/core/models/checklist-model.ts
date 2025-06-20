import { CollectibleModel } from './collectible-model';

export interface ChecklistModel {
  index: number;
  checked: boolean;
  description?: string;
  hasSticker: boolean;
  collectibleModel?: CollectibleModel;
}
