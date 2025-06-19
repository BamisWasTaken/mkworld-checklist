import { MapPosition } from "./map-position";

export interface StickerModel {
    index: number;
    checked: boolean;
    description: string;
    mapPosition?: MapPosition;
}