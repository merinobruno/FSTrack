import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Easing, StyleSheet, View } from 'react-native';

import { HeaderActions } from '@/components/app-header';
import { Lockup } from '@/components/brand';
import EnviosDrawer from '@/components/envios-drawer';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Effects, FontFamily, Motion, Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const [enviosOpen, setEnviosOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user]);

  if (loading || !user) return null;

  const HeaderLeft = () => <Lockup size={22} style={styles.headerLeft} />;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          // Fundido cruzado en lugar del corte seco por defecto. Las pestañas
          // son hermanas, no hay jerarquía entre ellas, así que un
          // desplazamiento lateral daría una dirección que no existe.
          animation: 'fade',
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: Motion.tab,
              easing: Easing.out(Easing.quad),
            },
          },
          // El navy es el color de superficie del sistema; el rojo se reserva
          // para el indicador, que es una marca gráfica y no texto chico.
          tabBarActiveTintColor: Palette.navy,
          tabBarInactiveTintColor: Palette.steelText,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          headerStyle: styles.header,
          headerShadowVisible: false,
          headerTitle: '',
          headerLeft: () => <HeaderLeft />,
          headerRight: () => <HeaderActions onOpenEnvios={() => setEnviosOpen(true)} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <IconSymbol size={26} name="house.fill" color={color} />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="pedidos"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <MaterialCommunityIcons name="shopping-outline" size={24} color={color} />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="formularios"
          options={{
            title: 'Formularios',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <MaterialCommunityIcons
                  name="clipboard-edit-outline"
                  size={24}
                  color={color}
                />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="ayuda"
          options={{
            title: 'Ayuda',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <MaterialCommunityIcons name="help-circle-outline" size={24} color={color} />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen name="Envios" options={{ href: null }} />
      </Tabs>

      <EnviosDrawer visible={enviosOpen} onClose={() => setEnviosOpen(false)} />
    </>
  );
}

/** Icono de tab con el indicador rojo de la pestaña activa. */
function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.tabIcon}>
      <View style={[styles.indicator, focused && styles.indicatorOn]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Palette.surfaceHigh,
    borderBottomWidth: 1,
    borderBottomColor: Effects.hairline,
  },
  headerLeft: { marginLeft: 16 },
  tabBar: {
    backgroundColor: Palette.surfaceHigh,
    borderTopWidth: 1,
    borderTopColor: Effects.hairline,
    height: 68,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabItem: { paddingVertical: 2 },
  tabLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  tabIcon: { alignItems: 'center', gap: 4 },
  indicator: {
    width: 18,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  indicatorOn: { backgroundColor: Palette.red },
});
