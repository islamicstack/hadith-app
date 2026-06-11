import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AppColors } from '../constants/colors';
import { useDrawer } from '../context/DrawerContext';
import { useTheme } from '../context/ThemeContext';

const DRAWER_WIDTH = 280;

type NavItem = {
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',        route: '/',            icon: 'home-outline' },
  { label: 'Search',      route: '/search',      icon: 'search-outline' },
  { label: 'Bookmarks',   route: '/bookmarks',   icon: 'bookmark-outline' },
  { label: 'Collections', route: '/collections', icon: 'library-outline' },
];

export function CustomDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
          mass: 0.8,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Semi-transparent overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={closeDrawer}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sliding drawer panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
        {/* Branding */}
        <View style={styles.brand}>
          <Text style={styles.brandName}>IslamicStack</Text>
          <Text style={styles.brandSub}>Hadith Library</Text>
        </View>

        {/* Nav items */}
        <View style={styles.navSection}>
          {NAV_ITEMS.map(item => (
            <TouchableOpacity
              key={item.route}
              style={styles.navItem}
              onPress={() => {
                closeDrawer();
                router.push(item.route as any);
              }}
            >
              <Ionicons name={item.icon} size={20} color={colors.gold} style={styles.navIcon} />
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* Theme toggle */}
        <View style={styles.themeSection}>
          <Text style={styles.themeLabel}>Theme</Text>
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
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      backgroundColor: 'black',
    },
    panel: {
      position: 'absolute',
      top: 0, left: 0, bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: colors.bgAlt,
      paddingTop: 60,
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 16,
    },
    brand: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 8,
    },
    brandName: {
      fontSize: 22, fontWeight: '800', letterSpacing: 0.5,
      color: colors.gold, marginBottom: 4,
    },
    brandSub: { fontSize: 12, letterSpacing: 1, color: colors.textDim },

    navSection: { paddingHorizontal: 16, paddingTop: 8 },
    navItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 13,
      marginBottom: 4, borderRadius: 10,
    },
    navIcon: { marginRight: 14 },
    navLabel: { fontSize: 15, fontWeight: '600', color: colors.text },

    themeSection: {
      padding: 20,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    themeLabel: {
      fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
      color: colors.muted, marginBottom: 10,
    },
    themePills: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, overflow: 'hidden',
    },
    pill: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    pillActive: { backgroundColor: colors.gold },
    pillText: { fontSize: 13, fontWeight: '600' },
  });
}
