import { useAppStore } from '../store/useAppStore';
import { translations } from '../config/translations';
import type { Language } from '../config/translations';



export const useTranslation = () => {
  const language = useAppStore((state) => state.language) as Language;
  
  const t = (key: string): any => {
    const keys = key.split('.');
    let result: any = translations[language] || translations.en;
    
    for (const k of keys) {
      if (result[k] === undefined) {
        // Fallback to English
        let fallback: any = translations.en;
        for (const fk of keys) {
          if (fallback[fk] === undefined) return key;
          fallback = fallback[fk];
        }
        return fallback;
      }
      result = result[k];
    }
    
    return result;
  };

  return { t, currentLanguage: language };
};
