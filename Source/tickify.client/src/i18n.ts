import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import viTranslation from './locales/vi/translation.json';

// Đảm bảo JSON được parse đúng và là object
const enTrans = typeof enTranslation === 'object' ? enTranslation : JSON.parse(JSON.stringify(enTranslation));
const viTrans = typeof viTranslation === 'object' ? viTranslation : JSON.parse(JSON.stringify(viTranslation));

const resources = {
  en: {
    translation: enTrans,
  },
  vi: {
    translation: viTrans,
  },
};

// Debug: Kiểm tra xem ticketRefund có trong resources không
if (import.meta.env.DEV) {
  console.log('i18n resources check:', {
    hasEnTicketRefund: !!enTrans?.ticketRefund,
    hasViTicketRefund: !!viTrans?.ticketRefund,
    enTicketRefundKeys: enTrans?.ticketRefund ? Object.keys(enTrans.ticketRefund).slice(0, 5) : [],
    viTicketRefundKeys: viTrans?.ticketRefund ? Object.keys(viTrans.ticketRefund).slice(0, 5) : [],
  });
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation'],
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
    returnEmptyString: false,
    returnObjects: true,
    // Đảm bảo load đúng namespace
    load: 'languageOnly',
    cleanCode: true,
  });

export default i18n;
