import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'en' | 'ar' | 'ur';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
];

const RTL_LANGUAGES: Language[] = ['ar', 'ur'];

const STORAGE_KEY = 'islamicstack:language';

const translations = {
  home: { en: 'Home', ar: 'الرئيسية', ur: 'ہوم' },
  search: { en: 'Search', ar: 'بحث', ur: 'تلاش' },
  bookmarks: { en: 'Bookmarks', ar: 'المحفوظات', ur: 'محفوظ شدہ' },
  collections: { en: 'Collections', ar: 'المجموعات', ur: 'مجموعے' },
  searchHadithPlaceholder: { en: 'Search Hadith...', ar: 'ابحث عن حديث...', ur: 'حدیث تلاش کریں...' },
  searchInputPlaceholder: { en: 'Search in English or Arabic...', ar: 'ابحث بالعربية أو الإنجليزية...', ur: 'عربی یا انگریزی میں تلاش کریں...' },
  dailyHadith: { en: 'Daily Hadith', ar: 'حديث اليوم', ur: 'آج کی حدیث' },
  readMore: { en: 'Read more', ar: 'اقرأ المزيد', ur: 'مزید پڑھیں' },
  seeAll: { en: 'See all', ar: 'عرض الكل', ur: 'سب دیکھیں' },
  noResultsFound: { en: 'No results found', ar: 'لم يتم العثور على نتائج', ur: 'کوئی نتیجہ نہیں ملا' },
  loading: { en: 'Loading...', ar: 'جار التحميل...', ur: 'لوڈ ہو رہا ہے...' },
  recentSearches: { en: 'Recent Searches', ar: 'عمليات البحث الأخيرة', ur: 'حالیہ تلاشیں' },
  popularTopics: { en: 'Popular Topics', ar: 'مواضيع شائعة', ur: 'مقبول موضوعات' },
  back: { en: 'Back', ar: 'رجوع', ur: 'واپس' },
} satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof translations;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'en' || stored === 'ar' || stored === 'ur') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const t = (key: TranslationKey) => translations[key][language] ?? translations[key].en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isRTL: RTL_LANGUAGES.includes(language),
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
