import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

// Detect user language
const getLocales = Localization.getLocales();
const languageCode = getLocales[0]?.languageCode ?? 'en';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            es: { translation: es },
            pt: { translation: pt },
            fr: { translation: fr },
            de: { translation: de },
        },
        lng: languageCode, // Initial language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React handles escaping
        },
        // compatibilityJSON: 'v3', // Removed to fix type error; Hermes supports Intl now
        react: {
            useSuspense: false // Handle async loading manually if needed, but synchronous for JSON s is fine
        }
    });

export default i18n;
