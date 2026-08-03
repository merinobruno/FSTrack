import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Effects,
  FontFamily,
  Gradients,
  Palette,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';

export type NavCardProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  onPress?: () => void;
  disabled?: boolean;
};

/**
 * Tarjeta de navegación de los índices de Formularios y Pedidos.
 *
 * Las versiones anteriores asignaban un color distinto a cada entrada —índigo,
 * verde, rojo, ámbar, celeste—, lo que contradice la regla de que el rojo de
 * marca es el único color saturado del sistema. Acá el recuadro del icono va
 * siempre con el degradé navy y la diferenciación queda a cargo del icono.
 */
export function NavCard({
  icon,
  title,
  description,
  onPress,
  disabled = false,
}: NavCardProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.card,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[...Gradients.navy.colors]}
        locations={[...Gradients.navy.locations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconBox}
      >
        <MaterialCommunityIcons name={icon} size={24} color={Palette.white} />
      </LinearGradient>

      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <MaterialCommunityIcons
        name={disabled ? 'lock-outline' : 'chevron-right'}
        size={20}
        color={Palette.steelDeep}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Effects.hairline,
    backgroundColor: Palette.surfaceHigh,
    ...Effects.panelShadow,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: {
    ...Type.body,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
  },
  description: {
    ...Type.caption,
    color: Palette.steelText,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});
