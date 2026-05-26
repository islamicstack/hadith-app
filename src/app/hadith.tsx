import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../services/supabase';

const C = {
  bg: '#080B10',
  surface: '#0F1319',
  card: '#141920',
  border: '#1E2535',
  gold: '#C8A96E',
  goldLight: '#E2C98A',
  goldDim: '#6B5A35',
  teal: '#3ECFB8',
  text: '#EAE6DC',
  textDim: '#9BA3B2',
  muted: '#4A5268',
  accent: '#4E8EC4',
  green: '#5DB87A',
  red: '#E87A5D',
};

export default function HadithScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
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
    if (data) setHadith(data);
    setLoading(false);
  };

  const handleShare = async () => {
    if (!hadith) return;
    await Share.share({
      message: `${hadith.arabic_text}\n\n"${hadith.english_translation}"\n\n— ${hadith.narrator}\n${hadith.reference} | IslamicStack`,
    });
  };

  const gradeColor = (grade: string) => {
    if (!grade) return C.muted;
    if (grade.toLowerCase().includes('sahih')) return C.green;
    if (grade.toLowerCase().includes('hasan')) return C.gold;
    return C.red;
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.gold} />
    </View>
  );

  if (!hadith) return (
    <View style={styles.center}>
      <Text style={{ color: C.muted }}>Hadith not found</Text>
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
            {hadith.arabic_text}
          </Text>
          {/* Font size controls */}
          <View style={styles.fontControls}>
            <TouchableOpacity
              style={styles.fontBtn}
              onPress={() => setFontSize(f => Math.max(14, f - 2))}
            >
              <Text style={styles.fontBtnText}>A−</Text>
            </TouchableOpacity>
            <Text style={styles.fontLabel}>Font Size</Text>
            <TouchableOpacity
              style={styles.fontBtn}
              onPress={() => setFontSize(f => Math.min(36, f + 2))}
            >
              <Text style={styles.fontBtnText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* English Translation */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>✦ English Translation</Text>
          <Text style={styles.englishText}>
            "{hadith.english_translation}"
          </Text>
        </View>

        {/* Urdu Translation */}
        {hadith.urdu_translation && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>✦ Urdu Translation</Text>
            <Text style={[styles.englishText, { textAlign: 'right' }]}>
              {hadith.urdu_translation}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>NARRATOR</Text>
            <Text style={styles.metaValue}>{hadith.narrator}</Text>
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
            <Text style={[styles.metaValue, { color: C.accent, fontFamily: 'monospace' }]}>
              {hadith.reference}
            </Text>
          </View>
        </View>

        {/* Bookmark Button */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
            onPress={() => setBookmarked(b => !b)}
          >
            <Text style={[styles.bookmarkText, bookmarked && { color: C.bg }]}>
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
            <Text style={[styles.navBtnText, { color: C.bg }]}>Next →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, paddingTop: 56,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerBtn: { minWidth: 60 },
  headerCenter: { alignItems: 'center' },
  backText: { color: C.gold, fontSize: 14 },
  shareText: { color: C.accent, fontSize: 14, textAlign: 'right' },
  headerSub: { fontSize: 11, color: C.muted, marginBottom: 2 },
  headerTitle: { fontSize: 13, fontWeight: '600', color: C.text },

  arabicCard: {
    margin: 20,
    backgroundColor: '#16200E',
    borderWidth: 1, borderColor: C.goldDim,
    borderRadius: 16, padding: 20,
  },
  arabicLabel: { fontSize: 10, letterSpacing: 2, color: C.goldDim, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' },
  arabicText: { color: C.goldLight, textAlign: 'right', lineHeight: 44, marginBottom: 16 },
  fontControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.goldDim + '44' },
  fontBtn: { backgroundColor: C.goldDim + '44', borderWidth: 1, borderColor: C.goldDim, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  fontBtnText: { color: C.gold, fontSize: 12, fontWeight: '700' },
  fontLabel: { fontSize: 11, color: C.muted },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, color: C.teal, textTransform: 'uppercase', marginBottom: 12 },
  englishText: { fontSize: 15, color: C.text, lineHeight: 26, fontStyle: 'italic' },

  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 20 },

  metaGrid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  metaCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, width: '47%' },
  metaLabel: { fontSize: 10, letterSpacing: 1, color: C.muted, marginBottom: 6 },
  metaValue: { fontSize: 12, color: C.text, lineHeight: 18 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gradeDot: { width: 8, height: 8, borderRadius: 4 },
  gradeText: { fontSize: 14, fontWeight: '700' },

  actions: { paddingHorizontal: 20, marginBottom: 12 },
  bookmarkBtn: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, alignItems: 'center' },
  bookmarkBtnActive: { backgroundColor: C.gold, borderColor: C.gold },
  bookmarkText: { fontSize: 14, fontWeight: '600', color: C.gold },

  navRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  navBtn: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, alignItems: 'center' },
  navBtnPrimary: { backgroundColor: C.gold, borderColor: C.gold },
  navBtnText: { fontSize: 13, fontWeight: '600', color: C.textDim },
});