import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AppColors } from '../../constants/colors';
import { DrawerToggle } from '../../components/DrawerToggle';
import { useTheme } from '../../context/ThemeContext';
import {
  type Bookmark,
  type BookmarkCollection,
  addBookmark,
  createCollection,
  deleteCollection,
  getBookmarksByCollection,
  getCollections,
  removeBookmark,
} from '../../services/bookmarkService';

const ICON_OPTIONS = ['⭐', '📖', '🌙', '🤲', '💡', '📚', '👨‍👩‍👧', '🕌', '☪️', '🌿'];
const COLOR_OPTIONS = ['#C8A96E', '#3ECFB8', '#4E8EC4', '#A084E8', '#5DB87A', '#E87A5D', '#F4A261', '#E9C46A'];

const stripTags = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function BookmarksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>('favourites');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');
  const [newColor, setNewColor] = useState('#C8A96E');

  useFocusEffect(useCallback(() => { loadData(); }, [activeCollection]));

  const loadData = async () => {
    const cols = await getCollections();
    setCollections(cols);
    const bmarks = await getBookmarksByCollection(activeCollection);
    setBookmarks(bmarks);
  };

  const handleSelectCollection = async (collectionId: string) => {
    setActiveCollection(collectionId);
    setBookmarks(await getBookmarksByCollection(collectionId));
  };

  const handleDeleteBookmark = (hadithId: string, reference: string) => {
    Alert.alert('Remove Bookmark', `Remove "${reference}" from bookmarks?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await removeBookmark(hadithId); loadData(); } },
    ]);
  };

  const handleMoveBookmark = (item: Bookmark) => {
    Alert.alert('📂 Move to Collection', 'Choose a collection:', [
      ...collections.map(col => ({
        text: `${col.icon} ${col.name}`,
        onPress: async () => {
          await removeBookmark(item.hadithId);
          await addBookmark({
            id: item.hadithId, hadith_number: item.hadithNumber,
            arabic_text: item.arabicText, english_translation: item.englishText,
            reference: item.reference, grade: item.grade, grade_source: item.gradeSource,
            collections: { name: item.collectionName },
          } as any, [col.id]);
          loadData();
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLongPress = (item: Bookmark) => {
    Alert.alert('🔖 Manage Bookmark', item.reference, [
      { text: '📂 Move to Collection', onPress: () => handleMoveBookmark(item) },
      { text: '🗑️ Remove Bookmark', style: 'destructive', onPress: () => handleDeleteBookmark(item.hadithId, item.reference) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteCollection = (col: BookmarkCollection) => {
    if (col.isDefault) { Alert.alert('Cannot Delete', 'Default collections cannot be deleted.'); return; }
    Alert.alert('Delete Collection', `Delete "${col.name}"? Bookmarks won't be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCollection(col.id); setActiveCollection('favourites'); loadData(); } },
    ]);
  };

  const handleCreateCollection = async () => {
    if (!newName.trim()) return;
    await createCollection(newName.trim(), newIcon, newColor);
    setNewName(''); setNewIcon('⭐'); setNewColor('#C8A96E');
    setShowNewCollection(false);
    loadData();
  };

  const activeCol = collections.find(c => c.id === activeCollection);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <DrawerToggle color={colors.gold} />
        <Text style={styles.headerLabel}>✦ Bookmarks</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewCollection(true)}>
          <Text style={styles.addBtnText}>+ Collection</Text>
        </TouchableOpacity>
      </View>

      {/* Collections Row */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.collectionsRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {collections.map(col => (
          <TouchableOpacity
            key={col.id}
            style={[styles.collectionChip, activeCollection === col.id && { backgroundColor: col.color + '22', borderColor: col.color }]}
            onPress={() => handleSelectCollection(col.id)}
            onLongPress={() => handleDeleteCollection(col)}
          >
            <Text style={styles.collectionIcon}>{col.icon}</Text>
            <Text style={[styles.collectionChipText, activeCollection === col.id && { color: col.color, fontWeight: '700' }]}>
              {col.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeCol && (
        <View style={styles.collectionTitle}>
          <Text style={styles.collectionTitleIcon}>{activeCol.icon}</Text>
          <Text style={[styles.collectionTitleText, { color: activeCol.color }]}>{activeCol.name}</Text>
          <Text style={styles.collectionCount}>{bookmarks.length} hadith{bookmarks.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      <FlatList
        data={bookmarks}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyText}>No bookmarks yet</Text>
            <Text style={styles.emptySubText}>Tap the bookmark icon on any hadith to save it here</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookmarkCard}
            onPress={() => router.push({ pathname: '/hadith', params: { hadithId: item.hadithId } })}
            onLongPress={() => handleLongPress(item)}
          >
            <View style={styles.bookmarkHeader}>
              <View style={styles.bookmarkMeta}>
                <Text style={styles.bookmarkCollection}>{item.collectionName}</Text>
                <Text style={styles.bookmarkNumber}>#{item.hadithNumber}</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleDeleteBookmark(item.hadithId, item.reference)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bookmarkArabic} numberOfLines={2}>{stripTags(item.arabicText)}</Text>
            <Text style={styles.bookmarkEnglish} numberOfLines={3}>"{stripTags(item.englishText)}"</Text>
            {item.note ? (
              <View style={styles.noteContainer}>
                <Text style={styles.noteIcon}>📝</Text>
                <Text style={styles.noteText} numberOfLines={2}>{item.note}</Text>
              </View>
            ) : null}
            <View style={styles.bookmarkFooter}>
              <Text style={styles.bookmarkReference}>{item.reference}</Text>
              {item.grade ? (
                <Text style={[styles.bookmarkGrade, {
                  color: item.grade.toLowerCase().includes('sahih') || item.grade.toLowerCase().includes('authentic')
                    ? colors.green : colors.gold,
                }]}>
                  {item.grade}
                </Text>
              ) : null}
            </View>
            <Text style={styles.longPressHint}>Hold to manage</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showNewCollection} transparent animationType="slide" onRequestClose={() => setShowNewCollection(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Collection name..."
              placeholderTextColor={colors.muted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Text style={styles.modalLabel}>Choose Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, newIcon === icon && styles.iconOptionActive]}
                  onPress={() => setNewIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }, newColor === color && styles.colorOptionActive]}
                  onPress={() => setNewColor(color)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowNewCollection(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, !newName.trim() && { opacity: 0.5 }]}
                onPress={handleCreateCollection}
                disabled={!newName.trim()}
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, paddingTop: 60,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerLabel: { fontSize: 10, letterSpacing: 3, color: colors.gold, textTransform: 'uppercase' },
    addBtn: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    },
    addBtnText: { fontSize: 12, color: colors.accent, fontWeight: '600' },

    collectionsRow: {
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
      paddingVertical: 12, maxHeight: 60,
    },
    collectionChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    },
    collectionIcon: { fontSize: 14 },
    collectionChipText: { fontSize: 12, color: colors.textDim },

    collectionTitle: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    collectionTitleIcon: { fontSize: 18 },
    collectionTitleText: { fontSize: 14, fontWeight: '700', flex: 1 },
    collectionCount: { fontSize: 12, color: colors.muted },

    emptyContainer: { alignItems: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 16, color: colors.textDim, marginBottom: 8 },
    emptySubText: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },

    bookmarkCard: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 14, marginBottom: 10,
    },
    bookmarkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    bookmarkMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bookmarkCollection: { fontSize: 12, fontWeight: '700', color: colors.gold },
    bookmarkNumber: { fontSize: 11, color: colors.muted },
    removeBtn: { padding: 4 },
    removeBtnText: { fontSize: 14, color: colors.red },
    bookmarkArabic: { fontSize: 15, color: colors.goldLight, textAlign: 'right', marginBottom: 8, lineHeight: 26, fontFamily: 'Scheherazade' },
    bookmarkEnglish: { fontSize: 13, color: colors.text, lineHeight: 20, fontStyle: 'italic', marginBottom: 8 },
    noteContainer: {
      flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      backgroundColor: colors.surface, borderRadius: 8, padding: 10, marginBottom: 8,
    },
    noteIcon: { fontSize: 12 },
    noteText: { fontSize: 12, color: colors.textDim, flex: 1, lineHeight: 18 },
    bookmarkFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    bookmarkReference: { fontSize: 11, color: colors.muted },
    bookmarkGrade: { fontSize: 11, fontWeight: '600' },
    longPressHint: { fontSize: 10, color: colors.muted, textAlign: 'right', opacity: 0.6 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 24, paddingBottom: 40,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    modalInput: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
      color: colors.text, fontSize: 14, marginBottom: 16,
    },
    modalLabel: { fontSize: 10, letterSpacing: 2, color: colors.muted, textTransform: 'uppercase', marginBottom: 10 },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    iconOption: {
      width: 44, height: 44, borderRadius: 10,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      justifyContent: 'center', alignItems: 'center',
    },
    iconOptionActive: { borderColor: colors.gold, backgroundColor: colors.gold + '22' },
    iconOptionText: { fontSize: 20 },
    colorGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    colorOption: { width: 32, height: 32, borderRadius: 16 },
    colorOptionActive: { borderWidth: 3, borderColor: colors.text },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalCancelBtn: {
      flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, padding: 14, alignItems: 'center',
    },
    modalCancelText: { fontSize: 14, color: colors.textDim },
    modalCreateBtn: { flex: 1, backgroundColor: colors.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
    modalCreateText: { fontSize: 14, fontWeight: '700', color: colors.bg },
  });
}
