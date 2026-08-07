import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { FontFamily, Motion, Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Acciones de la cabecera: abrir el panel de envíos y cerrar sesión.
 *
 * Estaba duplicado literalmente en los tres layouts que montan el drawer
 * (tabs, formularios y pedidos).
 */
export function HeaderActions({ onOpenEnvios }: { onOpenEnvios: () => void }) {
  const { signOut } = useAuth();

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={onOpenEnvios}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Ver envíos"
      >
        <MaterialCommunityIcons
          name="clipboard-list-outline"
          size={24}
          color={Palette.navy}
        />
      </Pressable>
      <Pressable
        onPress={async () => {
          await signOut();
          router.replace('/login');
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <IconSymbol
          size={24}
          name="rectangle.portrait.and.arrow.right"
          color={Palette.navy}
        />
      </Pressable>
    </View>
  );
}

/**
 * Opciones de `Stack` de marca: cabecera, fondo de página y transición.
 *
 * La transición es un fundido en lugar del deslizamiento por defecto. El
 * deslizamiento sugiere jerarquía lateral —ir "más adentro"—, y acá pasar del
 * índice a un formulario es más un cambio de contexto que un avance.
 */
export const brandStackOptions = {
  headerStyle: {
    backgroundColor: Palette.surfaceHigh,
  },
  headerShadowVisible: false,
  headerTintColor: Palette.navy,
  headerTitleStyle: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    color: Palette.navy,
  },
  contentStyle: { backgroundColor: Palette.surface },
  animation: 'fade',
  animationDuration: Motion.screen,
} as const;

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 18,
  },
});
