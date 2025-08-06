import { CollectibleType } from './collectible-type';
import { Map } from './map';

export interface Settings {
  showCollectedStickers: boolean;
  showCollectedCollectibles: boolean;
  shownCollectibleTypes: CollectibleType[];
  map: Map;
}
