import { Tabs, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import EnviosDrawer from '@/components/envios-drawer';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading, signOut } = useAuth();
  const [enviosOpen, setEnviosOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user]);

  if (loading || !user) return null;

  const iconColor = Colors[colorScheme ?? 'light'].text;

  const HeaderRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 18 }}>
      <Pressable onPress={() => setEnviosOpen(true)} hitSlop={10}>
        <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={iconColor} />
      </Pressable>
      <Pressable
        onPress={async () => { await signOut(); router.replace('/login'); }}
        hitSlop={10}
      >
        <IconSymbol size={24} name="rectangle.portrait.and.arrow.right" color={iconColor} />
      </Pressable>
    </View>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            headerShown: true,
            headerRight: () => <HeaderRight />,
          }}
        />
        <Tabs.Screen
          name="pedidos"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="shopping-outline" size={24} color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="formularios"
          options={{
            title: 'Formularios',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-edit-outline" size={24} color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="ayuda"
          options={{
            title: 'Ayuda',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="help-circle-outline" size={24} color={color} />,
            headerShown: true,
            headerRight: () => <HeaderRight />,
          }}
        />
        <Tabs.Screen
          name="Envios"
          options={{ href: null }}
        />
      </Tabs>

      <EnviosDrawer visible={enviosOpen} onClose={() => setEnviosOpen(false)} />
    </>
  );
}
