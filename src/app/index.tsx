import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
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
};

const COLLECTION_COLORS = [C.gold, C.teal, C.accent, '#A084E8', C.green, '#E87A5D'];

export default function HomeScreen() {
  const [collections, setCollections] = useState<any[]>([]);
  const [dailyHadith, setDailyHadith] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load collections
      const { data: cols } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order');

      // Load today's daily hadith
      const today = new Date().toISOString().split('T')[0];
      const { data: daily } = await supabase
        .from('daily_hadith')
        .select('*, hadiths(*)')
        .eq('date', today)
        .single();

      if (cols) setCollections(cols);
      if (daily) setDailyHadith(daily);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.gold} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateLabel}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.greeting}>السلام عليكم</Text>
          <Text style={styles.greetingSub}>Peace be upon you</Text>
        </View>

        {/* Daily Hadith Card */}
        {dailyHadith && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>✦ Daily Hadith</Text>
            <TouchableOpacity style={styles.dailyCard}>
              <Text style={styles.arabicText}>
                {dailyHadith.hadiths?.arabic_text}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.englishText}>
                "{dailyHadith.hadiths?.english_translation}"
              </Text>
              <View style={styles.dailyFooter}>
                <Text style={styles.dailySource}>
                  {dailyHadith.hadiths?.reference}
                </Text>
                <Text style={styles.readMore}>Read more →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Collections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>✦ Collections</Text>
            <Text style={styles.seeAll}>See all</Text>
          </View>
          <View style={styles.collectionsGrid}>
            {collections.map((col, i) => (
              <TouchableOpacity
                key={col.id}
                style={[styles.collectionCard, { borderLeftColor: COLLECTION_COLORS[i] }]}
              >
                <Text style={[styles.collectionArabic, { color: COLLECTION_COLORS[i] }]}>
                  {col.arabic_name}
                </Text>
                <Text style={styles.collectionName}>{col.name}</Text>
                <Text style={styles.collectionCount}>
                  {col.total_hadiths.toLocaleString()} Hadith
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Streak */}
        <View style={styles.section}>
          <View style={styles.streakCard}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View>
              <Text style={styles.streakTitle}>3 Day Streak</Text>
              <Text style={styles.streakSub}>Read today's Hadith to keep it going</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.muted, marginTop: 12, fontSize: 13 },

  header: { padding: 24, paddingTop: 60 },
  dateLabel: { fontSize: 11, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  greeting: { fontSize: 28, fontWeight: '700', color: C.text, marginBottom: 2 },
  greetingSub: { fontSize: 13, color: C.textDim },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, color: C.gold, textTransform: 'uppercase', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 12, color: C.accent },

  dailyCard: {
    backgroundColor: '#16200E',
    borderWidth: 1, borderColor: C.goldDim,
    borderRadius: 16, padding: 20,
  },
  arabicText: {
    fontSize: 20, color: C.goldLight,
    textAlign: 'right', lineHeight: 36,
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: C.goldDim, opacity: 0.4, marginBottom: 14 },
  englishText: { fontSize: 14, color: C.text, lineHeight: 24, fontStyle: 'italic', marginBottom: 14 },
  dailyFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  dailySource: { fontSize: 11, color: C.muted },
  readMore: { fontSize: 11, color: C.gold },

  collectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  collectionCard: {
    width: '47%',
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 3,
    borderRadius: 10, padding: 14,
  },
  collectionArabic: { fontSize: 16, marginBottom: 6, textAlign: 'right' },
  collectionName: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  collectionCount: { fontSize: 11, color: C.muted },

  streakCard: {
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  streakIcon: { fontSize: 32 },
  streakTitle: { fontSize: 16, fontWeight: '700', color: C.gold, marginBottom: 2 },
  streakSub: { fontSize: 12, color: C.muted },
});