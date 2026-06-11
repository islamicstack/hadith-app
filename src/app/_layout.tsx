import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomDrawer } from '../components/CustomDrawer';
import { DrawerProvider } from '../context/DrawerContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function AppNavigator() {
  const { isDark, colors } = useTheme();
  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={colors.statusBar} />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="hadith" />
        </Stack>
        <CustomDrawer />
      </View>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Scheherazade': require('../../assets/font/ScheherazadeNew-Regular.ttf'),
    'JameelNoori': require('../../assets/font/JameelNooriNastaleeq.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080B10', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#C8A96E" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <ThemeProvider>
          <DrawerProvider>
            <AppNavigator />
          </DrawerProvider>
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
