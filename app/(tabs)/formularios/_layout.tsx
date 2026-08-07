import { Stack } from 'expo-router';
import { useState } from 'react';

import { HeaderActions, brandStackOptions } from '@/components/app-header';
import EnviosDrawer from '@/components/envios-drawer';

export default function FormulariosLayout() {
  const [enviosOpen, setEnviosOpen] = useState(false);

  return (
    <>
      <Stack
        screenOptions={{
          ...brandStackOptions,
          headerRight: () => <HeaderActions onOpenEnvios={() => setEnviosOpen(true)} />,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Formularios' }} />
        <Stack.Screen name="produccion" options={{ title: 'Producción' }} />
        <Stack.Screen name="nacimientos" options={{ title: 'Nacimientos' }} />
        <Stack.Screen name="muertes" options={{ title: 'Muertes' }} />
        <Stack.Screen name="traslados" options={{ title: 'Traslados' }} />
        <Stack.Screen name="novedades" options={{ title: 'Novedades' }} />
      </Stack>
      <EnviosDrawer visible={enviosOpen} onClose={() => setEnviosOpen(false)} />
    </>
  );
}
