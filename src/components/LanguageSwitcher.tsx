import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AppColors } from '../constants/colors';
import { LANGUAGES, useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

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

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.gold,
    },
    pillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textDim,
    },
    pillTextActive: {
      color: colors.bg,
    },
  });
}
