import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AppColors } from '../../constants/colors';
import { DrawerToggle } from '../../components/DrawerToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTheme } from '../../context/ThemeContext';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <DrawerToggle color={colors.gold} />
        <Text style={styles.headerLabel}>✦ Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Language</Text>
          <View style={styles.card}>
            <Text style={styles.settingTitle}>Display Language</Text>
            <Text style={styles.settingDesc}>Choose the language for translations and UI</Text>
            <LanguageSwitcher />
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.card}>
            <Text style={styles.settingTitle}>Theme</Text>
            <Text style={styles.settingDesc}>Choose how IslamicStack looks on your device</Text>
            <View style={styles.themePills}>
              <TouchableOpacity
                style={[styles.pill, mode === 'dark' && styles.pillActive]}
                onPress={() => setMode('dark')}
              >
                <Text style={[styles.pillText, { color: mode === 'dark' ? colors.bg : colors.muted }]}>
                  🌙 Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, mode === 'light' && styles.pillActive]}
                onPress={() => setMode('light')}
              >
                <Text style={[styles.pillText, { color: mode === 'light' ? colors.bg : colors.muted }]}>
                  ☀️ Light
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutHeader}>
              <Text style={styles.appName}>IslamicStack</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v{APP_VERSION}</Text>
              </View>
            </View>
            <Text style={styles.aboutMission}>
              A free, open-source hadith library bringing authentic Islamic knowledge to every device.
              Sourced from Sunnah.com and HadeethEnc.com — with Arabic, English, and Urdu translations.
            </Text>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutKey}>Sources</Text>
              <Text style={styles.aboutValue}>Sunnah.com · HadeethEnc.com</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutKey}>Collections</Text>
              <Text style={styles.aboutValue}>Bukhari, Muslim, Abu Dawud & more</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutKey}>Built with</Text>
              <Text style={styles.aboutValue}>Expo · React Native · Supabase</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, paddingTop: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerLabel: { fontSize: 10, letterSpacing: 3, color: colors.gold, textTransform: 'uppercase' },

    scroll: { padding: 20 },

    section: { marginBottom: 28 },
    sectionLabel: {
      fontSize: 10, letterSpacing: 2, color: colors.gold,
      textTransform: 'uppercase', marginBottom: 10,
    },

    card: {
      backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 14, padding: 16,
    },
    settingTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    settingDesc: { fontSize: 12, color: colors.muted, marginBottom: 14, lineHeight: 18 },

    themePills: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, overflow: 'hidden',
    },
    pill: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    pillActive: { backgroundColor: colors.gold },
    pillText: { fontSize: 13, fontWeight: '600' },

    aboutHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    appName: { fontSize: 20, fontWeight: '800', color: colors.gold, letterSpacing: 0.5 },
    versionBadge: {
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
    },
    versionText: { fontSize: 11, color: colors.muted, fontWeight: '600' },

    aboutMission: {
      fontSize: 13, color: colors.textDim,
      lineHeight: 20, marginBottom: 16,
    },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
    aboutRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 10,
    },
    aboutKey: { fontSize: 11, color: colors.muted, letterSpacing: 0.5, flex: 1 },
    aboutValue: { fontSize: 12, color: colors.text, fontWeight: '600', flex: 2, textAlign: 'right' },
  });
}
