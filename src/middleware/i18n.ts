import {
  defineI18nMiddleware,
  detectLocaleFromAcceptLanguageHeader,
  useTranslation,
} from '@intlify/hono';

// importing locales
import ar from '../locales/ar/ar.json' with { type: 'json' };
import en from '../locales/en/en.json' with { type: 'json' };

const i18nMiddleware = defineI18nMiddleware({
  // detect language
  locale: detectLocaleFromAcceptLanguageHeader,
  // locales
  messages: {
    en,
    ar,
  },
});

export { i18nMiddleware, useTranslation };
