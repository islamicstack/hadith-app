import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LANGUAGES, useLanguage } from '../context/LanguageContext';

const C = {
  bg: '#080B10',
  card: '#141920',
  border: '#1E2535',
  gold: '#C8A96E',
  textDim: '#9BA3B2',
};

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      {LANGUAGES.map(lang => {
        const active = lang.code === language;
        return (
          <TouchableOpacity
            key={lang.code}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => setLanguage(lang.code)}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {lang.nativeLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 4,
    gap: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillActive: {
    backgroundColor: C.gold,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textDim,
  },
  pillTextActive: {
    color: C.bg,
  },
});
