import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// Types
// ============================================================
export interface BookmarkCollection {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  hadithId: string;
  collectionIds: string[];
  hadithNumber: number;
  arabicText: string;
  englishText: string;
  reference: string;
  grade: string;
  gradeSource: string;
  collectionName: string;
  note: string;
  savedAt: string;
}

// ============================================================
// Storage Keys
// ============================================================
const KEYS = {
  COLLECTIONS: 'islamicstack:bookmark_collections',
  BOOKMARKS: 'islamicstack:bookmarks',
};

// ============================================================
// Default Collections
// ============================================================
export const DEFAULT_COLLECTIONS: BookmarkCollection[] = [
  { id: 'favourites',      name: 'Favourites',       icon: '❤️', color: '#E87A5D', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'reading-list',    name: 'Reading List',      icon: '📖', color: '#4E8EC4', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'ramadan',         name: 'Ramadan',           icon: '🌙', color: '#A084E8', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'family',          name: 'Family',            icon: '👨‍👩‍👧', color: '#3ECFB8', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'studying',        name: 'Currently Studying',icon: '📚', color: '#C8A96E', isDefault: true, createdAt: new Date().toISOString() },
];

// ============================================================
// Collection Operations
// ============================================================
export const getCollections = async (): Promise<BookmarkCollection[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.COLLECTIONS);
    if (!data) {
      // First time — save and return defaults
      await AsyncStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(DEFAULT_COLLECTIONS));
      return DEFAULT_COLLECTIONS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_COLLECTIONS;
  }
};

export const createCollection = async (name: string, icon: string, color: string): Promise<BookmarkCollection> => {
  const collections = await getCollections();
  const newCollection: BookmarkCollection = {
    id: `custom-${Date.now()}`,
    name,
    icon,
    color,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };
  collections.push(newCollection);
  await AsyncStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(collections));
  return newCollection;
};

export const deleteCollection = async (collectionId: string): Promise<void> => {
  // Remove collection
  const collections = await getCollections();
  const filtered = collections.filter(c => c.id !== collectionId);
  await AsyncStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(filtered));

  // Remove collection from all bookmarks
  const bookmarks = await getBookmarks();
  const updated = bookmarks.map(b => ({
    ...b,
    collectionIds: b.collectionIds.filter(id => id !== collectionId),
  }));
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(updated));
};

// ============================================================
// Bookmark Operations
// ============================================================
export const getBookmarks = async (): Promise<Bookmark[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getBookmarksByCollection = async (collectionId: string): Promise<Bookmark[]> => {
  const bookmarks = await getBookmarks();
  return bookmarks.filter(b => b.collectionIds.includes(collectionId));
};

export const isBookmarked = async (hadithId: string): Promise<boolean> => {
  const bookmarks = await getBookmarks();
  return bookmarks.some(b => b.hadithId === hadithId);
};

export const getBookmark = async (hadithId: string): Promise<Bookmark | null> => {
  const bookmarks = await getBookmarks();
  return bookmarks.find(b => b.hadithId === hadithId) || null;
};

export const addBookmark = async (
  hadith: any,
  collectionIds: string[] = ['favourites']
): Promise<Bookmark> => {
  const bookmarks = await getBookmarks();

  // Check if already bookmarked — update collections if so
  const existing = bookmarks.find(b => b.hadithId === hadith.id);
  if (existing) {
    const merged = [...new Set([...existing.collectionIds, ...collectionIds])];
    const updated = bookmarks.map(b =>
      b.hadithId === hadith.id ? { ...b, collectionIds: merged } : b
    );
    await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(updated));
    return { ...existing, collectionIds: merged };
  }

  const newBookmark: Bookmark = {
    id: `bookmark-${Date.now()}`,
    hadithId: hadith.id,
    collectionIds,
    hadithNumber: hadith.hadith_number,
    arabicText: hadith.arabic_text || '',
    englishText: hadith.english_translation || '',
    reference: hadith.reference || '',
    grade: hadith.grade || '',
    gradeSource: hadith.grade_source || '',
    collectionName: hadith.collections?.name || '',
    note: '',
    savedAt: new Date().toISOString(),
  };

  bookmarks.unshift(newBookmark); // Add to top
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  return newBookmark;
};

export const removeBookmark = async (hadithId: string): Promise<void> => {
  const bookmarks = await getBookmarks();
  const filtered = bookmarks.filter(b => b.hadithId !== hadithId);
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(filtered));
};

export const updateBookmarkNote = async (hadithId: string, note: string): Promise<void> => {
  const bookmarks = await getBookmarks();
  const updated = bookmarks.map(b =>
    b.hadithId === hadithId ? { ...b, note } : b
  );
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(updated));
};

export const getBookmarkCount = async (): Promise<number> => {
  const bookmarks = await getBookmarks();
  return bookmarks.length;
};
