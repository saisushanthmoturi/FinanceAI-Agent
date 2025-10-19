/**
 * Global Language Context for Multi-lingual Support
 * 
 * Features:
 * - Provides language state across the entire application
 * - Supports Hindi, Tamil, Telugu, and English
 * - Persistent language selection in localStorage
 * - Translation utilities for all components
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Translation interface
export interface Translations {
  // Navigation
  'Dashboard': Record<SupportedLanguage, string>;
  'Report': Record<SupportedLanguage, string>;
  'Portfolio': Record<SupportedLanguage, string>;
  'Tax': Record<SupportedLanguage, string>;
  'AI Agents': Record<SupportedLanguage, string>;
  'Stocks': Record<SupportedLanguage, string>;
  'Risk': Record<SupportedLanguage, string>;
  'Profile': Record<SupportedLanguage, string>;
  
  // Common UI
  'Loading': Record<SupportedLanguage, string>;
  'Save': Record<SupportedLanguage, string>;
  'Cancel': Record<SupportedLanguage, string>;
  'Delete': Record<SupportedLanguage, string>;
  'Edit': Record<SupportedLanguage, string>;
  'Close': Record<SupportedLanguage, string>;
  'Submit': Record<SupportedLanguage, string>;
  'Search': Record<SupportedLanguage, string>;
  
  // Financial Terms
  'Amount': Record<SupportedLanguage, string>;
  'Balance': Record<SupportedLanguage, string>;
  'Investment': Record<SupportedLanguage, string>;
  'Returns': Record<SupportedLanguage, string>;
  'Portfolio Value': Record<SupportedLanguage, string>;
  'Financial Health Score': Record<SupportedLanguage, string>;
  'Risk Profile': Record<SupportedLanguage, string>;
  'Tax Saved': Record<SupportedLanguage, string>;
  'Monthly Income': Record<SupportedLanguage, string>;
  'Expenses': Record<SupportedLanguage, string>;
  'Goals': Record<SupportedLanguage, string>;
  
  // AI Features
  'Ask AI Assistant': Record<SupportedLanguage, string>;
  'Voice Assistant': Record<SupportedLanguage, string>;
  'AI is thinking...': Record<SupportedLanguage, string>;
  'Custom Input': Record<SupportedLanguage, string>;
  'Language Settings': Record<SupportedLanguage, string>;
  'Financial Goals': Record<SupportedLanguage, string>;
  'Risk Tolerance': Record<SupportedLanguage, string>;
  'Current Age': Record<SupportedLanguage, string>;
}

// Global translations object
export const translations: Translations = {
  // Navigation
  'Dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    ta: 'டாஷ்போர்டு',
    te: 'డాష్‌బోర్డ్',
  },
  'Report': {
    en: 'Report',
    hi: 'रिपोर्ट',
    ta: 'அறிக்கை',
    te: 'నివేదిక',
  },
  'Portfolio': {
    en: 'Portfolio',
    hi: 'पोर्टफोलियो',
    ta: 'போர்ட்ஃபோலியோ',
    te: 'పోర్ట్‌ఫోలియో',
  },
  'Tax': {
    en: 'Tax',
    hi: 'कर',
    ta: 'வரி',
    te: 'పన్ను',
  },
  'AI Agents': {
    en: 'AI Agents',
    hi: 'एआई एजेंट',
    ta: 'AI முகவர்கள்',
    te: 'AI ఏజెంట్లు',
  },
  'Stocks': {
    en: 'Stocks',
    hi: 'स्टॉक',
    ta: 'பங்குகள்',
    te: 'స్టాక్స్',
  },
  'Risk': {
    en: 'Risk',
    hi: 'जोखिम',
    ta: 'ஆபத்து',
    te: 'రిస్క్',
  },
  'Profile': {
    en: 'Profile',
    hi: 'प्रोफ़ाइल',
    ta: 'சுயவிவரம்',
    te: 'ప్రొఫైల్',
  },
  
  // Common UI
  'Loading': {
    en: 'Loading...',
    hi: 'लोड हो रहा है...',
    ta: 'ஏற்றுகிறது...',
    te: 'లోడ్ అవుతోంది...',
  },
  'Save': {
    en: 'Save',
    hi: 'सेव करें',
    ta: 'சேமிக்கவும்',
    te: 'సేవ్ చేయండి',
  },
  'Cancel': {
    en: 'Cancel',
    hi: 'रद्द करें',
    ta: 'ரத்து செய்யவும்',
    te: 'రద్దు చేయండి',
  },
  'Delete': {
    en: 'Delete',
    hi: 'हटाएं',
    ta: 'நீக்கவும்',
    te: 'తొలగించండి',
  },
  'Edit': {
    en: 'Edit',
    hi: 'संपादित करें',
    ta: 'திருத்தவும்',
    te: 'సవరించండి',
  },
  'Close': {
    en: 'Close',
    hi: 'बंद करें',
    ta: 'மூடவும்',
    te: 'మూసివేయండి',
  },
  'Submit': {
    en: 'Submit',
    hi: 'सबमिट करें',
    ta: 'சமர்பிக்கவும்',
    te: 'సమర్పించండి',
  },
  'Search': {
    en: 'Search',
    hi: 'खोजें',
    ta: 'தேடவும்',
    te: 'వెతకండి',
  },
  
  // Financial Terms
  'Amount': {
    en: 'Amount',
    hi: 'राशि',
    ta: 'தொகை',
    te: 'మొత్తం',
  },
  'Balance': {
    en: 'Balance',
    hi: 'शेष राशि',
    ta: 'நிலுவை',
    te: 'బ్యాలెన్స్',
  },
  'Investment': {
    en: 'Investment',
    hi: 'निवेश',
    ta: 'முதலீடு',
    te: 'పెట్టుబడి',
  },
  'Returns': {
    en: 'Returns',
    hi: 'रिटर्न',
    ta: 'வருமானம்',
    te: 'రిటర్న్స్',
  },
  'Portfolio Value': {
    en: 'Portfolio Value',
    hi: 'पोर्टफोलियो मूल्य',
    ta: 'போர்ட்ஃபோலியோ மதிப்பு',
    te: 'పోర్ట్‌ఫోలియో విలువ',
  },
  'Financial Health Score': {
    en: 'Financial Health Score',
    hi: 'वित्तीय स्वास्थ्य स्कोर',
    ta: 'நிதி சுகாதார மதிப்பெண்',
    te: 'ఆర్థిక ఆరోగ్య స్కోరు',
  },
  'Risk Profile': {
    en: 'Risk Profile',
    hi: 'जोखिम प्रोफ़ाइल',
    ta: 'ஆபத்து சுயவிவரம்',
    te: 'రిస్క్ ప్రొఫైల్',
  },
  'Tax Saved': {
    en: 'Tax Saved',
    hi: 'कर बचत',
    ta: 'சேமித்த வரி',
    te: 'పన్ను ఆదా',
  },
  'Monthly Income': {
    en: 'Monthly Income',
    hi: 'मासिक आय',
    ta: 'மாதாந்திர வருமானம்',
    te: 'నెలవారీ ఆదాయం',
  },
  'Expenses': {
    en: 'Expenses',
    hi: 'व्यय',
    ta: 'செலவுகள்',
    te: 'ఖర్చులు',
  },
  'Goals': {
    en: 'Goals',
    hi: 'लक्ष्य',
    ta: 'இலக्குகள்',
    te: 'లక్ష్యాలు',
  },
  
  // AI Features
  'Ask AI Assistant': {
    en: 'Ask AI Assistant',
    hi: 'एआई सहायक से पूछें',
    ta: 'AI உதவியாளரிடம் கேளுங்கள்',
    te: 'AI అసిస్టెంట్‌ను అడగండి',
  },
  'Voice Assistant': {
    en: 'Voice Assistant',
    hi: 'वॉयस असिस्टेंट',
    ta: 'குரல் உதவியாளர்',
    te: 'వాయిస్ అసిస్టెంట్',
  },
  'AI is thinking...': {
    en: 'AI is thinking...',
    hi: 'एआई सोच रहा है...',
    ta: 'AI சிந்தித்துக்கொண்டிருக்கிறது...',
    te: 'AI ఆలోచిస్తోంది...',
  },
  'Custom Input': {
    en: 'Custom Input',
    hi: 'कस्टम इनपुट',
    ta: 'தனிப்பயன் உள்ளீடு',
    te: 'కస్టమ్ ఇన్‌పుట్',
  },
  'Language Settings': {
    en: 'Language Settings',
    hi: 'भाषा सेटिंग्स',
    ta: 'மொழி அமைப்புகள்',
    te: 'భాష సెట్టింగ్‌లు',
  },
  'Financial Goals': {
    en: 'Financial Goals',
    hi: 'वित्तीय लक्ष्य',
    ta: 'நிதி இலக்குகள்',
    te: 'ఆర్థిక లక్ష్యాలు',
  },
  'Risk Tolerance': {
    en: 'Risk Tolerance',
    hi: 'जोखिम सहनशीलता',
    ta: 'ஆபத்து சகிப்புத்தன்மை',
    te: 'రిస్క్ టాలరెన్స్',
  },
  'Current Age': {
    en: 'Current Age',
    hi: 'वर्तमान आयु',
    ta: 'தற்போதைய வயது',
    te: 'ప్రస్తుత వయస్సు',
  },
};

// Language Context
interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: keyof Translations) => string;
  getSupportedLanguages: () => typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language Provider Component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    // Get language from localStorage or default to English
    const savedLanguage = localStorage.getItem('preferredLanguage') as SupportedLanguage;
    return savedLanguage && Object.keys(SUPPORTED_LANGUAGES).includes(savedLanguage) 
      ? savedLanguage 
      : 'en';
  });

  const setLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferredLanguage', language);
  };

  const t = (key: keyof Translations): string => {
    return translations[key]?.[currentLanguage] || key;
  };

  const getSupportedLanguages = () => SUPPORTED_LANGUAGES;

  useEffect(() => {
    // Set document language attribute
    document.documentElement.lang = currentLanguage === 'en' ? 'en' : 
                                   currentLanguage === 'hi' ? 'hi' :
                                   currentLanguage === 'ta' ? 'ta' : 'te';
  }, [currentLanguage]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    getSupportedLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
