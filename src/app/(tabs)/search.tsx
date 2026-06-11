import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
import { supabase } from '../../services/supabase';

const RECENT_SEARCHES = ['intention', 'prayer', 'kindness', 'knowledge', 'patience'];

const SOURCE_FILTERS = [
  { key: 'all',        label: 'All Sources' },
  { key: 'sunnah',     label: 'Sunnah.com' },
  { key: 'hadeethenc', label: 'HadeethEnc' },
];

const BOOK_FILTERS = ['All', 'Bukhari', 'Muslim', 'Abu Dawud', 'Tirmidhi', 'Nasai', 'Ibn Majah', 'Sahih only'];

const stripTags = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState('all');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.length > 2) {
      const timer = setTimeout(() => search(), 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [query, activeFilter, activeSource]);

  const search = async () => {
    setLoading(true);
    setSearched(true);

    let queryBuilder = supabase
      .from('hadiths')
      .select('id, hadith_number, english_translation, arabic_text, narrator, grade, grade_source, reference, collections(name, slug)')
      .ilike('english_translation', `%${query}%`)
      .limit(20);

    if (activeSource === 'sunnah') queryBuilder = queryBuilder.eq('grade_source', 'Sunnah.com');
    else if (activeSource === 'hadeethenc') queryBuilder = queryBuilder.eq('grade_source', 'HadeethEnc.com');

    if (activeFilter === 'Sahih only') {
      queryBuilder = queryBuilder.or('grade.ilike.%sahih%,grade.ilike.%authentic%');
    } else if (activeFilter !== 'All') {
      const bookNames: Record<string, string> = {
        'Bukhari': 'Sahih al-Bukhari', 'Muslim': 'Sahih Muslim',
        'Abu Dawud': 'Sunan Abu Dawud', 'Tirmidhi': 'Jami at-Tirmidhi',
        'Nasai': "Sunan an-Nasa'i", 'Ibn Majah': 'Sunan Ibn Majah',
      };
      const collectionName = bookNames[activeFilter];
      if (collectionName) {
        const { data: col } = await supabase.from('collections').select('id').eq('name', collectionName).single();
        if (col) queryBuilder = queryBuilder.eq('collection_id', col.id);
      }
    }

    const { data } = await queryBuilder;
    setResults(data || []);
    setLoading(false);
  };

  const gradeColor = (grade: string) => {
    if (!grade) return colors.muted;
    const g = grade.toLowerCase();
    if (g.includes('sahih') || g.includes('authentic')) return colors.green;
    if (g.includes('hasan')) return colors.gold;
    return colors.red;
  };

  const sourceColor = (source: string) => {
    if (source === 'HadeethEnc.com') return colors.purple;
    if (source === 'Sunnah.com') return colors.teal;
    return colors.muted;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <DrawerToggle color={colors.gold} />
          <Text style={styles.headerLabel}>✦ Search</Text>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⊙</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search in English or Arabic..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={search}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sourceRow}>
          {SOURCE_FILTERS.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sourceChip, activeSource === s.key && styles.sourceChipActive]}
              onPress={() => { setActiveSource(s.key); setActiveFilter('All'); }}
            >
              <Text style={[styles.sourceText, activeSource === s.key && styles.sourceTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeSource !== 'hadeethenc' && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={BOOK_FILTERS}
            keyExtractor={item => item}
            style={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : query.length > 2 && searched ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubText}>Try different keywords or source</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => router.push({ pathname: '/hadith', params: { hadithId: item.id } })}
            >
              <View style={styles.resultHeader}>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultCollection}>{item.collections?.name}</Text>
                  <Text style={styles.resultNumber}>#{item.hadith_number}</Text>
                </View>
                <View style={styles.gradeRow}>
                  <View style={[styles.gradeDot, { backgroundColor: gradeColor(item.grade) }]} />
                  <Text style={[styles.gradeText, { color: gradeColor(item.grade) }]}>{item.grade}</Text>
                </View>
              </View>
              <Text style={styles.resultArabic} numberOfLines={2}>{stripTags(item.arabic_text)}</Text>
              <Text style={styles.resultPreview} numberOfLines={3}>{stripTags(item.english_translation)}</Text>
              <View style={styles.resultFooter}>
                <Text style={styles.resultNarrator} numberOfLines={1}>{stripTags(item.narrator)}</Text>
                {item.grade_source ? (
                  <Text style={[styles.resultSource, { color: sourceColor(item.grade_source) }]}>
                    {item.grade_source}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <ScrollView style={styles.recentContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.recentLabel}>Recent Searches</Text>
          {RECENT_SEARCHES.map(term => (
            <TouchableOpacity key={term} style={styles.recentItem} onPress={() => setQuery(term)}>
              <Text style={styles.recentIcon}>⟳</Text>
              <Text style={styles.recentText}>{term}</Text>
              <Text style={styles.recentArrow}>→</Text>
            </TouchableOpacity>
          ))}
          <Text style={[styles.recentLabel, { marginTop: 24 }]}>Popular Topics</Text>
          <View style={styles.topicsGrid}>
            {['Prayer', 'Fasting', 'Charity', 'Patience', 'Honesty', 'Knowledge', 'Family', 'Forgiveness'].map(topic => (
              <TouchableOpacity key={topic} style={styles.topicChip} onPress={() => setQuery(topic)}>
                <Text style={styles.topicText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

    header: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      padding: 20, paddingTop: 56,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    headerLabel: { fontSize: 10, letterSpacing: 3, color: colors.gold, textTransform: 'uppercase' },

    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
    },
    searchIcon: { fontSize: 16, color: colors.muted },
    searchInput: { flex: 1, color: colors.text, fontSize: 14 },
    clearBtn: { color: colors.muted, fontSize: 16 },

    sourceRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    sourceChip: {
      flex: 1, alignItems: 'center', backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 7,
    },
    sourceChipActive: { backgroundColor: colors.teal + '22', borderColor: colors.teal },
    sourceText: { fontSize: 12, color: colors.textDim, fontWeight: '500' },
    sourceTextActive: { color: colors.teal, fontWeight: '700' },

    filterList: { marginBottom: 4 },
    filterChip: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8,
    },
    filterChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    filterText: { fontSize: 12, color: colors.textDim },
    filterTextActive: { color: colors.bg, fontWeight: '700' },

    loadingText: { color: colors.muted, marginTop: 10, fontSize: 13 },
    resultCount: { fontSize: 12, color: colors.muted, marginBottom: 12 },
    resultCard: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 14, marginBottom: 10,
    },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    resultCollection: { fontSize: 12, fontWeight: '700', color: colors.gold },
    resultNumber: { fontSize: 11, color: colors.muted },
    gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    gradeDot: { width: 6, height: 6, borderRadius: 3 },
    gradeText: { fontSize: 11 },
    resultArabic: { fontSize: 14, color: colors.goldLight, textAlign: 'right', marginBottom: 8, lineHeight: 24 },
    resultPreview: { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: 6 },
    resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resultNarrator: { fontSize: 11, color: colors.muted, flex: 1 },
    resultSource: { fontSize: 10, fontWeight: '600', marginLeft: 8 },

    emptyText: { fontSize: 16, color: colors.textDim, marginBottom: 6 },
    emptySubText: { fontSize: 13, color: colors.muted },

    recentContainer: { padding: 20 },
    recentLabel: { fontSize: 10, letterSpacing: 2, color: colors.gold, textTransform: 'uppercase', marginBottom: 12 },
    recentItem: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    recentIcon: { fontSize: 14, color: colors.muted },
    recentText: { flex: 1, fontSize: 14, color: colors.textDim },
    recentArrow: { fontSize: 14, color: colors.muted },

    topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    topicChip: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    },
    topicText: { fontSize: 13, color: colors.text },
  });
}
