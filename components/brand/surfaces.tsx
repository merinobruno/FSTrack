import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Effects, Gradients, Palette, Radius, Spacing } from '@/constants/theme';

export type ScreenProps = ViewProps & {
  /** Bordes seguros a respetar. Por defecto solo el inferior lo maneja el tab bar. */
  edges?: readonly Edge[];
};

/**
 * Fondo de pantalla: el degradé gris diagonal del sistema.
 *
 * El sistema Fisterra no usa fondo blanco en ninguna pieza — el blanco aparece
 * solo como filo de panel y como texto sobre navy.
 */
export function Screen({ children, style, edges, ...rest }: ScreenProps) {
  const content = (
    <View style={[styles.flex, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <LinearGradient
      colors={[...Gradients.surface.colors]}
      locations={[...Gradients.surface.locations]}
      start={Gradients.surface.start}
      end={Gradients.surface.end}
      style={styles.flex}
    >
      {edges ? (
        <SafeAreaView style={styles.flex} edges={edges}>
          {content}
        </SafeAreaView>
      ) : (
        content
      )}
    </LinearGradient>
  );
}

/**
 * Panel: el contenedor principal del sistema. Radio 28, filo blanco al 85% y
 * una sombra apenas perceptible.
 *
 * Es también la superficie sobre la que se apoya el titular pareado: el rojo
 * de marca alcanza 3.25:1 sobre este gris claro, contra 2.88:1 sobre el gris
 * de página, que no llega al mínimo de texto grande.
 */
export function Panel({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.panel, style]} {...rest}>
      {children}
    </View>
  );
}

/**
 * Tarjeta de lista. Mismo vocabulario que el panel pero con radio menor, para
 * elementos repetidos dentro de un scroll.
 */
export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: {
    backgroundColor: Palette.surfaceHigh,
    borderRadius: Radius.panel,
    borderWidth: 1.5,
    borderColor: Effects.hairline,
    padding: Spacing.lg,
    ...Effects.panelShadow,
  },
  card: {
    backgroundColor: Palette.surfaceHigh,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Effects.hairline,
    padding: Spacing.md,
    ...Effects.panelShadow,
  },
});
