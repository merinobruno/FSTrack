import {
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { SubmissionsProvider } from '@/contexts/SubmissionsContext';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { FontFamily, Palette } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {
  /* el splash ya se ocultó: no es un error accionable */
});

/**
 * Tema de navegación Fisterra. La app es de modo claro únicamente, así que no
 * hay rama oscura: el fondo es el gris del sistema y el acento es el rojo de
 * marca.
 */
const FisterraNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Palette.red,
    background: Palette.surface,
    card: Palette.surfaceHigh,
    text: Palette.ink,
    border: 'rgba(10, 47, 67, 0.12)',
    notification: Palette.red,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_400Regular_Italic,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    // Si las fuentes fallan se sigue igual con la de sistema: quedarse en el
    // splash sería peor que perder Montserrat.
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <CompanyProvider>
        <WorkflowProvider>
          <SubmissionsProvider>
            <ThemeProvider value={FisterraNavTheme}>
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: Palette.surface },
                  headerStyle: { backgroundColor: Palette.surfaceHigh },
                  headerTintColor: Palette.navy,
                  headerTitleStyle: { fontFamily: FontFamily.semibold },
                }}
              >
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: 'modal', title: 'Modal' }}
                />
              </Stack>
              <StatusBar style="dark" />
            </ThemeProvider>
          </SubmissionsProvider>
        </WorkflowProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}
