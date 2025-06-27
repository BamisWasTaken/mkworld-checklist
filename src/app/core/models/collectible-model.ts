import { CollectibleType } from './collectible-type';

export interface CollectibleModel {
  collectibleType: CollectibleType;
  youtubeId?: string;
  missionName?: string;
  xPercentage: number;
  yPercentage: number;
}
