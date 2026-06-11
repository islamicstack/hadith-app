import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AppColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { addBookmark, isBookmarked, removeBookmark } from '../services/bookmarkService';
import { supabase } from '../services/supabase';

const stripTags = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function HadithScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [hadith, setHadith] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState(22);

  useEffect(() => {
    if (params.hadithId) loadHadith();
  }, [params.hadithId]);

  const loadHadith = async () => {
    const { data } = await supabase
      .from('hadiths')
      .select('*, collections(name, arabic_name)')
      .eq('id', params.hadithId)
      .single();
    if (data) {
      setHadith(data);
      setBookmarked(await isBookmarked(data.id));
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!hadith) return;
    await Share.share({
      message: `${stripTags(hadith.arabic_text)}\n\n"${stripTags(hadith.english_translation)}"\n\n— ${stripTags(hadith.narrator)}\n${hadith.reference} | IslamicStack`,
    });
  };

  const gradeColor = (grade: string) => {
    if (!grade) return colors.muted;
    if (grade.toLowerCase().includes('sahih') || grade.toLowerCase().includes('authentic')) return colors.green;
    if (grade.toLowerCase().includes('hasan')) return colors.gold;
    return colors.red;
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.gold} />
    </View>
  );

  if (!hadith) return (
    <View style={styles.center}>
      <Text style={{ color: colors.muted }}>Hadith not found</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>Hadith #{hadith.hadith_number}</Text>
          <Text style={styles.headerTitle}>{hadith.collections?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Arabic Card */}
        <View style={styles.arabicCard}>
          <Text style={styles.arabicLabel}>✦ Arabic Text</Text>
          <Text style={[styles.arabicText, { fontSize }]}>
            {stripTags(hadith.arabic_text)}
          </Text>
          <View style={styles.fontControls}>
            <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(f => Math.max(14, f - 2))}>
              <Text style={styles.fontBtnText}>A−</Text>
            </TouchableOpacity>
            <Text style={styles.fontLabel}>Font Size</Text>
            <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(f => Math.min(36, f + 2))}>
              <Text style={styles.fontBtnText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* English Translation */}
        <View style={styles.translationCard}>
          <Text style={styles.sectionLabel}>✦ English Translation</Text>
          <Text style={styles.englishText}>"{stripTags(hadith.english_translation)}"</Text>
        </View>

        {/* Urdu Translation */}
        {hadith.urdu_translation ? (
          <View style={styles.translationCard}>
            <Text style={styles.sectionLabel}>✦ اردو ترجمہ</Text>
            <Text style={[styles.englishText, { textAlign: 'right', fontFamily: 'JameelNoori', fontSize: 20, lineHeight: 48 }]}>
              {stripTags(hadith.urdu_translation)}
            </Text>
          </View>
        ) : null}

        {/* Explanation */}
        {hadith.explanation ? (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Text style={styles.explanationIcon}>💡</Text>
              <Text style={styles.explanationLabel}>Scholar's Explanation</Text>
            </View>
            <Text style={styles.explanationText}>{stripTags(hadith.explanation)}</Text>
          </View>
        ) : null}

        {/* Benefits */}
        {hadith.benefits ? (
          <View style={styles.benefitsCard}>
            <View style={styles.explanationHeader}>
              <Text style={styles.explanationIcon}>✨</Text>
              <Text style={styles.benefitsLabel}>Key Lessons</Text>
            </View>
            <Text style={styles.benefitsText}>{stripTags(hadith.benefits)}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>NARRATOR</Text>
            <Text style={styles.metaValue}>{stripTags(hadith.narrator)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>GRADE</Text>
            <View style={styles.gradeRow}>
              <View style={[styles.gradeDot, { backgroundColor: gradeColor(hadith.grade) }]} />
              <Text style={[styles.gradeText, { color: gradeColor(hadith.grade) }]}>
                {hadith.grade || 'Unknown'}
              </Text>
            </View>
          </View>
          <View style={[styles.metaCard, { width: '100%' }]}>
            <Text style={styles.metaLabel}>REFERENCE</Text>
            <Text style={[styles.metaValue, { color: colors.accent, fontFamily: 'monospace' }]}>
              {hadith.reference}
            </Text>
          </View>
          {hadith.grade_source ? (
            <View style={[styles.metaCard, { width: '100%' }]}>
              <Text style={styles.metaLabel}>SOURCE</Text>
              <Text style={[styles.metaValue, { color: colors.teal }]}>{hadith.grade_source}</Text>
            </View>
          ) : null}
        </View>

        {/* Bookmark Button */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
            onPress={async () => {
              if (bookmarked) {
                await removeBookmark(hadith.id);
                setBookmarked(false);
                Alert.alert('Removed', 'Bookmark removed successfully');
              } else {
                await addBookmark(hadith);
                setBookmarked(true);
                Alert.alert('🔖 Bookmarked!', 'Saved to Favourites. You can organize it from the Bookmarks tab.', [{ text: 'OK' }]);
              }
            }}
          >
            <Text style={[styles.bookmarkText, bookmarked && { color: colors.bg }]}>
              {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prev / Next */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn}>
            <Text style={styles.navBtnText}>← Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]}>
            <Text style={[styles.navBtnText, { color: colors.bg }]}>Next →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 16, paddingTop: 56,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerBtn: { minWidth: 60 },
    headerCenter: { alignItems: 'center' },
    backText: { color: colors.gold, fontSize: 14 },
    shareText: { color: colors.accent, fontSize: 14, textAlign: 'right' },
    headerSub: { fontSize: 11, color: colors.muted, marginBottom: 2 },
    headerTitle: { fontSize: 13, fontWeight: '600', color: colors.text },

    arabicCard: {
      margin: 20, backgroundColor: colors.arabicBg,
      borderWidth: 1, borderColor: colors.goldDim, borderRadius: 16, padding: 20,
    },
    arabicLabel: { fontSize: 10, letterSpacing: 2, color: colors.goldDim, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' },
    arabicText: { fontFamily: 'Scheherazade', color: colors.goldLight, textAlign: 'right', lineHeight: 44, marginBottom: 16 },
    fontControls: {
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16,
      paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.goldDim + '44',
    },
    fontBtn: {
      backgroundColor: colors.goldDim + '44', borderWidth: 1, borderColor: colors.goldDim,
      borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6,
    },
    fontBtnText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
    fontLabel: { fontSize: 11, color: colors.muted },

    sectionLabel: { fontSize: 10, letterSpacing: 2, color: colors.teal, textTransform: 'uppercase', marginBottom: 12 },
    translationCard: {
      marginHorizontal: 20, marginBottom: 20,
      backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border,
      borderRadius: 14, padding: 16,
    },
    englishText: { fontSize: 15, color: colors.text, lineHeight: 26, fontStyle: 'italic' },

    explanationCard: {
      marginHorizontal: 20, marginBottom: 16,
      backgroundColor: colors.explanationBg, borderWidth: 1, borderColor: colors.accent + '55',
      borderRadius: 14, padding: 16,
    },
    benefitsCard: {
      marginHorizontal: 20, marginBottom: 16,
      backgroundColor: colors.benefitsBg, borderWidth: 1, borderColor: colors.purple + '55',
      borderRadius: 14, padding: 16,
    },
    explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    explanationIcon: { fontSize: 16 },
    explanationLabel: { fontSize: 11, letterSpacing: 1, color: colors.accent, textTransform: 'uppercase', fontWeight: '700' },
    benefitsLabel: { fontSize: 11, letterSpacing: 1, color: colors.purple, textTransform: 'uppercase', fontWeight: '700' },
    explanationText: { fontSize: 14, color: colors.textDim, lineHeight: 24 },
    benefitsText: { fontSize: 14, color: colors.textDim, lineHeight: 24 },

    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 20, marginBottom: 20 },

    metaGrid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    metaCard: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, padding: 14, width: '47%',
    },
    metaLabel: { fontSize: 10, letterSpacing: 1, color: colors.muted, marginBottom: 6 },
    metaValue: { fontSize: 12, color: colors.text, lineHeight: 18 },
    gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    gradeDot: { width: 8, height: 8, borderRadius: 4 },
    gradeText: { fontSize: 14, fontWeight: '700' },

    actions: { paddingHorizontal: 20, marginBottom: 12 },
    bookmarkBtn: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 14, alignItems: 'center',
    },
    bookmarkBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    bookmarkText: { fontSize: 14, fontWeight: '600', color: colors.gold },

    navRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
    navBtn: {
      flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, padding: 14, alignItems: 'center',
    },
    navBtnPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
    navBtnText: { fontSize: 13, fontWeight: '600', color: colors.textDim },
  });
}
