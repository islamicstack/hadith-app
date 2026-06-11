import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AppColors } from '../../constants/colors';
import { DrawerToggle } from '../../components/DrawerToggle';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';

const ACCENT_COLORS = ['#C8A96E', '#3ECFB8', '#4E8EC4', '#A084E8', '#5DB87A', '#E87A5D', '#F4A261'];

const stripTags = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getDailyOffset = () => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % 2328;
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [collections, setCollections] = useState<any[]>([]);
  const [dailyHadith, setDailyHadith] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: cols } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order');

      const offset = getDailyOffset();
      const { data: dailyData } = await supabase
        .from('hadiths')
        .select('*, collections(name, slug)')
        .eq('grade_source', 'HadeethEnc.com')
        .range(offset, offset)
        .single();

      if (cols) setCollections(cols);
      if (dailyData) setDailyHadith(dailyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.gold} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <DrawerToggle color={colors.gold} />
            <View style={styles.headerRight}>
              <Text style={styles.dateLabel}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={styles.greeting}>السلام عليكم</Text>
              <Text style={styles.greetingSub}>Peace be upon you</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.searchShortcut}
            onPress={() => router.push('/search')}
          >
            <Text style={styles.searchShortcutIcon}>⊙</Text>
            <Text style={styles.searchShortcutText}>Search Hadith...</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Hadith Card */}
        {dailyHadith && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>✦ Daily Hadith</Text>
              <Text style={styles.dailyDate}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dailyCard}
              onPress={() => router.push({ pathname: '/hadith', params: { hadithId: dailyHadith.id } })}
            >
              {dailyHadith.grade ? (
                <View style={styles.gradeBadge}>
                  <View style={styles.gradeDot} />
                  <Text style={styles.gradeText}>{dailyHadith.grade}</Text>
                </View>
              ) : null}
              <Text style={styles.arabicText} numberOfLines={4}>
                {stripTags(dailyHadith.arabic_text)}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.englishText} numberOfLines={4}>
                "{stripTags(dailyHadith.english_translation)}"
              </Text>
              <View style={styles.dailyFooter}>
                <View>
                  <Text style={styles.dailySource}>{dailyHadith.reference}</Text>
                  <Text style={styles.dailySourceLabel}>{dailyHadith.collections?.name}</Text>
                </View>
                <Text style={styles.readMore}>Read more →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Collections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>✦ Collections</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.collectionsGrid}>
            {collections.map((col, i) => (
              <TouchableOpacity
                key={col.id}
                style={[styles.collectionCard, { borderLeftColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }]}
                onPress={() => router.push({
                  pathname: '/collections',
                  params: { collectionId: col.id, collectionName: col.name, collectionSlug: col.slug },
                })}
              >
                <Text style={[styles.collectionArabic, { color: ACCENT_COLORS[i % ACCENT_COLORS.length] }]}>
                  {col.arabic_name}
                </Text>
                <Text style={styles.collectionName}>{col.name}</Text>
                <Text style={styles.collectionCount}>{col.total_hadiths?.toLocaleString()} Hadith</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Streak */}
        <View style={styles.section}>
          <View style={styles.streakCard}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>3 Day Streak</Text>
              <Text style={styles.streakSub}>Read today's Hadith to keep it going</Text>
            </View>
            <TouchableOpacity
              style={styles.streakBtn}
              onPress={() => dailyHadith && router.push({ pathname: '/hadith', params: { hadithId: dailyHadith.id } })}
            >
              <Text style={styles.streakBtnText}>Read →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Attribution */}
        <View style={styles.section}>
          <Text style={styles.attribution}>
            Hadith data provided by Sunnah.com & HadeethEnc.com 🤲
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: colors.muted, marginTop: 12, fontSize: 13 },

    header: { padding: 24, paddingTop: 60, backgroundColor: colors.surface },
    headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    headerRight: { flex: 1, alignItems: 'flex-end' },
    dateLabel: { fontSize: 11, letterSpacing: 2, color: colors.muted, textTransform: 'uppercase', marginBottom: 2, textAlign: 'right' },
    greeting: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 2, fontFamily: 'Scheherazade', textAlign: 'right' },
    greetingSub: { fontSize: 13, color: colors.textDim, textAlign: 'right' },
    searchShortcut: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
      gap: 8,
    },
    searchShortcutIcon: { fontSize: 16, color: colors.muted },
    searchShortcutText: { fontSize: 14, color: colors.muted },

    section: { paddingHorizontal: 20, marginBottom: 24, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionLabel: { fontSize: 10, letterSpacing: 2, color: colors.gold, textTransform: 'uppercase' },
    seeAll: { fontSize: 12, color: colors.accent },
    dailyDate: { fontSize: 11, color: colors.muted },

    dailyCard: {
      backgroundColor: colors.arabicBg,
      borderWidth: 1, borderColor: colors.goldDim,
      borderRadius: 16, padding: 20,
    },
    gradeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    gradeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
    gradeText: { fontSize: 11, color: colors.green, fontWeight: '600' },
    arabicText: {
      fontFamily: 'Scheherazade', fontSize: 20, color: colors.goldLight,
      textAlign: 'right', lineHeight: 38, marginBottom: 14,
    },
    divider: { height: 1, backgroundColor: colors.goldDim, opacity: 0.4, marginBottom: 14 },
    englishText: { fontSize: 14, color: colors.text, lineHeight: 24, fontStyle: 'italic', marginBottom: 14 },
    dailyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    dailySource: { fontSize: 11, color: colors.gold, fontWeight: '600' },
    dailySourceLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
    readMore: { fontSize: 11, color: colors.gold },

    collectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    collectionCard: {
      width: '47%', backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
      borderRadius: 10, padding: 14,
    },
    collectionArabic: { fontSize: 16, marginBottom: 6, textAlign: 'right', fontFamily: 'Scheherazade' },
    collectionName: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
    collectionCount: { fontSize: 11, color: colors.muted },

    streakCard: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    streakIcon: { fontSize: 32 },
    streakTitle: { fontSize: 16, fontWeight: '700', color: colors.gold, marginBottom: 2 },
    streakSub: { fontSize: 12, color: colors.muted },
    streakBtn: { backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    streakBtnText: { fontSize: 12, fontWeight: '700', color: colors.bg },

    attribution: { fontSize: 11, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  });
}
