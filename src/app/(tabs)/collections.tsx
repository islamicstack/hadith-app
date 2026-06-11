import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AppColors } from '../../constants/colors';
import { DrawerToggle } from '../../components/DrawerToggle';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';

const COLLECTION_COLORS: Record<string, string> = {
  bukhari: '#C8A96E', muslim: '#3ECFB8', abudawud: '#4E8EC4',
  tirmidhi: '#A084E8', nasai: '#5DB87A', ibnmajah: '#E87A5D', hadeethenc: '#F4A261',
};

const stripTags = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function CollectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [hadiths, setHadiths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  const accentColor = COLLECTION_COLORS[params.collectionSlug as string] || colors.gold;

  useEffect(() => {
    if (params.collectionId) { loadHadiths(0, true); loadCount(); }
  }, [params.collectionId]);

  const loadCount = async () => {
    const { count } = await supabase
      .from('hadiths').select('id', { count: 'exact', head: true })
      .eq('collection_id', params.collectionId);
    if (count) setTotalCount(count);
  };

  const loadHadiths = async (pageNum: number, reset = false) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    const from = pageNum * PAGE_SIZE;
    const { data } = await supabase
      .from('hadiths')
      .select('id, hadith_number, arabic_text, english_translation, grade, narrator, reference')
      .eq('collection_id', params.collectionId)
      .order('hadith_number')
      .range(from, from + PAGE_SIZE - 1);
    if (data) {
      if (reset) setHadiths(data); else setHadiths(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum);
    }
    if (reset) setLoading(false); else setLoadingMore(false);
  };

  const gradeColor = (grade: string) => {
    if (!grade) return colors.muted;
    const g = grade.toLowerCase();
    if (g.includes('sahih') || g.includes('authentic')) return colors.green;
    if (g.includes('hasan')) return colors.gold;
    return colors.red;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: accentColor + '44' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <DrawerToggle color={colors.gold} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: accentColor }]}>{params.collectionName}</Text>
          <Text style={styles.subtitle}>{totalCount.toLocaleString()} Hadiths</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>Loading hadiths...</Text>
        </View>
      ) : (
        <FlatList
          data={hadiths}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => { if (!loadingMore && hasMore) loadHadiths(page + 1); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
            ) : !hasMore ? (
              <Text style={styles.endText}>— End of {params.collectionName} —</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No hadiths found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { borderLeftColor: accentColor }]}
              onPress={() => router.push({ pathname: '/hadith', params: { hadithId: item.id } })}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.hadithNumber, { color: accentColor }]}>#{item.hadith_number}</Text>
                {item.grade ? (
                  <View style={styles.gradeRow}>
                    <View style={[styles.gradeDot, { backgroundColor: gradeColor(item.grade) }]} />
                    <Text style={[styles.gradeText, { color: gradeColor(item.grade) }]}>{item.grade}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.arabicText} numberOfLines={2}>{stripTags(item.arabic_text)}</Text>
              <Text style={styles.englishText} numberOfLines={3}>{stripTags(item.english_translation)}</Text>
              {item.narrator ? <Text style={styles.narrator} numberOfLines={1}>{stripTags(item.narrator)}</Text> : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

    header: { padding: 20, paddingTop: 60, backgroundColor: colors.surface, borderBottomWidth: 1 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    backBtn: {},
    backText: { color: colors.gold, fontSize: 14 },
    headerInfo: {},
    title: { fontSize: 22, fontWeight: '700', marginBottom: 4, fontFamily: 'Scheherazade' },
    subtitle: { fontSize: 12, color: colors.muted },

    loadingText: { color: colors.muted, marginTop: 12, fontSize: 13 },

    card: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderLeftWidth: 3, borderRadius: 12, padding: 14, marginBottom: 10,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    hadithNumber: { fontSize: 13, fontWeight: '700' },
    gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    gradeDot: { width: 6, height: 6, borderRadius: 3 },
    gradeText: { fontSize: 11 },
    arabicText: {
      fontFamily: 'Scheherazade', fontSize: 16, color: colors.goldLight,
      textAlign: 'right', lineHeight: 30, marginBottom: 8,
    },
    englishText: { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: 6 },
    narrator: { fontSize: 11, color: colors.muted },

    endText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginVertical: 20 },
    emptyText: { fontSize: 16, color: colors.textDim },
  });
}
