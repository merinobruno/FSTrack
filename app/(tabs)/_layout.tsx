import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user]);

  if (loading || !user) {
    return null;
  }

  return (
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
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={async () => {
                await signOut();
                router.replace('/login');
              }}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                size={24}
                name="rectangle.portrait.and.arrow.right"
                color={Colors[colorScheme ?? 'light'].text}
              />
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="Produccion"
        options={{
          title: 'Producción',
          tabBarIcon: ({ color }) => (
            <AntDesign name="product" size={24} color={color} />
          ),
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={async () => {
                await signOut();
                router.replace('/login');
              }}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                size={24}
                name="rectangle.portrait.and.arrow.right"
                color={Colors[colorScheme ?? 'light'].text}
              />
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="Nacimientos"
        options={{
          title: 'Nacimientos',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cow" size={24} color={color} />
          ),
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={async () => {
                await signOut();
                router.replace('/login');
              }}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                size={24}
                name="rectangle.portrait.and.arrow.right"
                color={Colors[colorScheme ?? 'light'].text}
              />
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="Muertes"
        options={{
          title: 'Muertes',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cow-off" size={24} color={color} />
          ),
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={async () => {
                await signOut();
                router.replace('/login');
              }}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                size={24}
                name="rectangle.portrait.and.arrow.right"
                color={Colors[colorScheme ?? 'light'].text}
              />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}