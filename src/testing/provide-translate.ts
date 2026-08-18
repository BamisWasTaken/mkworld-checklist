import { provideTranslateService } from '@ngx-translate/core';

export function provideTestTranslate() {
  return provideTranslateService({ fallbackLang: 'en' });
}
