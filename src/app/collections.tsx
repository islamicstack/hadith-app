import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../services/supabase';

export default function CollectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.collectionId) {
      loadBooks();
    }
  }, [params.collectionId]);

  const loadBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('collection_id', params.collectionId)
      .order('book_number');
    if (data) setBooks(data);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{params.collectionName}</Text>
        <Text style={styles.subtitle}>{books.length} Books</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#C8A96E" style={{ marginTop: 40 }} />
      ) : books.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No books yet — coming soon inshaaAllah</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.bookName}>{item.name}</Text>
              <Text style={styles.bookCount}>{item.hadith_count} Hadith</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080B10' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#0F1319', borderBottomWidth: 1, borderBottomColor: '#1E2535' },
  back: { color: '#C8A96E', fontSize: 14, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#EAE6DC', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#4A5268' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#4A5268', fontSize: 14 },
  card: { backgroundColor: '#141920', borderRadius: 10, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#C8A96E' },
  bookName: { fontSize: 14, fontWeight: '600', color: '#EAE6DC', marginBottom: 4 },
  bookCount: { fontSize: 12, color: '#4A5268' },
});