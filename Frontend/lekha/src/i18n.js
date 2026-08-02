import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import hi from "./locales/hi/translation.json";
import bn from "./locales/bn/translation.json";
import mr from "./locales/mr/translation.json";

i18n
  .use(LanguageDetector) // auto-detect browser language
  .use(initReactI18next) // connect to React
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      bn: { translation: bn },
      mr: { translation: mr },
    },
    fallbackLng: "en", // if detected language isn't available, use English
    interpolation: {
      escapeValue: false, // What this does is prevent XSS attacks by escaping any HTML in the translation strings.
      // Since React already escapes content by default, we can safely set this to false.
    },
    detection: {
      // where to look for the user's language preference (in order)
      order: ["localStorage", "navigator"],
      // save the user's choice to localStorage so it persists
      caches: ["localStorage"],
    },
  });

export default i18n;
