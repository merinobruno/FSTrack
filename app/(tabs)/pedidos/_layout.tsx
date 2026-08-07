import { Stack } from 'expo-router';
import { useState } from 'react';

import { HeaderActions, brandStackOptions } from '@/components/app-header';
import EnviosDrawer from '@/components/envios-drawer';

export default function PedidosLayout() {
  const [enviosOpen, setEnviosOpen] = useState(false);

  return (
    <>
      <Stack
        screenOptions={{
          ...brandStackOptions,
          headerRight: () => <HeaderActions onOpenEnvios={() => setEnviosOpen(true)} />,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Pedidos' }} />
        <Stack.Screen name="compra" options={{ title: 'Pedido de Compra' }} />
        <Stack.Screen name="venta" options={{ title: 'Pedido de Venta' }} />
      </Stack>
      <EnviosDrawer visible={enviosOpen} onClose={() => setEnviosOpen(false)} />
    </>
  );
}
