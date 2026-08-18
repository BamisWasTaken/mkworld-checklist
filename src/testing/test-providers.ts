import { PLATFORM_ID } from '@angular/core';
import { IMAGE_CONFIG } from '@angular/common';
import { provideTestTranslate } from './provide-translate';

export default [
  provideTestTranslate(),
  { provide: PLATFORM_ID, useValue: 'browser' },
  {
    provide: IMAGE_CONFIG,
    useValue: { disableImageSizeWarning: true, disableImageLazyWarning: true },
  },
];
