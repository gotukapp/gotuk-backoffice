import { addMessages, init, locale } from 'svelte-i18n';
import { get } from 'svelte/store';

import en from './locales/en.json';
import pt from './locales/pt.json';

// Add translations
addMessages('en', en);
addMessages('pt', pt);

// Initialize i18n
try {
    init({
        fallbackLocale: 'en',
        initialLocale: get(locale) || 'en'
    });
} catch (error) {
    console.error("i18n initialization failed:", error);
}

export { locale };
