import { MapPosition } from './map-position';

export interface StickerModel {
  index: number;
  checked: boolean;
  description: string;
  instructions?: string;
  mapPosition?: MapPosition;
}
