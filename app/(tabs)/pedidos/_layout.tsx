import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import EnviosDrawer from '@/components/envios-drawer';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function PedidosLayout() {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const iconColor = Colors[colorScheme].text;
  const [enviosOpen, setEnviosOpen] = useState(false);

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
      <Stack screenOptions={{ headerRight: () => <HeaderRight /> }}>
        <Stack.Screen name="index" options={{ title: 'Pedidos' }} />
        <Stack.Screen name="compra" options={{ title: 'Pedido de Compra' }} />
        <Stack.Screen name="venta" options={{ title: 'Pedido de Venta' }} />
      </Stack>
      <EnviosDrawer visible={enviosOpen} onClose={() => setEnviosOpen(false)} />
    </>
  );
}
