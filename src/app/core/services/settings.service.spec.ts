import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CollectibleType, Map } from '../models';
import { SettingsService } from './settings.service';
import { flushEffects } from '../../../testing/async';
import { getSettingsStorage, setSettingsStorage } from '../../../testing/local-storage';

describe('SettingsService', () => {
  let service: SettingsService;

  function createService(): void {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
  }

  describe('defaults', () => {
    beforeEach(() => {
      createService();
    });

    it('should show stickers, hide collected collectibles, enable all types, and use the upscaled map', () => {
      expect(service.shouldShowCollectedStickers()()).toBe(true);
      expect(service.shouldShowCollectedCollectibles()()).toBe(false);
      expect(service.getShownCollectibleTypes()()).toEqual([
        CollectibleType.PEACH_COIN,
        CollectibleType.P_SWITCH,
        CollectibleType.QUESTIONMARK_PANEL,
      ]);
      expect(service.getMap()()).toBe(Map.UPSCALED_MAP);
    });

    it('should persist toggles to localStorage', () => {
      service.toggleShowCollectedStickers();
      service.toggleShowCollectibleType(CollectibleType.PEACH_COIN);
      service.setMap(Map.INGAME_MAP);
      flushEffects();

      expect(getSettingsStorage()).toEqual(
        expect.objectContaining({
          showCollectedStickers: false,
          shownCollectibleTypes: [CollectibleType.P_SWITCH, CollectibleType.QUESTIONMARK_PANEL],
          map: Map.INGAME_MAP,
        })
      );
    });
  });

  describe('when storage has saved settings', () => {
    beforeEach(() => {
      setSettingsStorage({
        showCollectedStickers: false,
        showCollectedCollectibles: true,
        shownCollectibleTypes: [CollectibleType.P_SWITCH],
        map: Map.INGAME_MAP,
      });
      createService();
    });

    it('should load saved settings', () => {
      expect(service.shouldShowCollectedStickers()()).toBe(false);
      expect(service.shouldShowCollectedCollectibles()()).toBe(true);
      expect(service.getShownCollectibleTypes()()).toEqual([CollectibleType.P_SWITCH]);
      expect(service.getMap()()).toBe(Map.INGAME_MAP);
    });
  });

  describe('when running on the server', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(SettingsService);
    });

    it('should keep map unset until the client hydrates', () => {
      expect(service.getMap()()).toBeNull();
    });
  });

  describe('importSettings', () => {
    beforeEach(() => {
      createService();
    });

    it('should apply only defined fields', () => {
      service.importSettings({
        showCollectedStickers: false,
      } as never);

      expect(service.shouldShowCollectedStickers()()).toBe(false);
      expect(service.shouldShowCollectedCollectibles()()).toBe(false);
      expect(service.getMap()()).toBe(Map.UPSCALED_MAP);
    });
  });
});
