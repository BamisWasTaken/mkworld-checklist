import { CollectibleType } from './collectible-type';

export interface CollectibleModel {
  collectibleType: CollectibleType;
  youtubeLink?: string;
  missionName?: string;
  xPercentage: number;
  yPercentage: number;
}
