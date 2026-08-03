import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  Effects,
  FontFamily,
  Gradients,
  Palette,
  Radius,
  Semantic,
  Type,
} from '@/constants/theme';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botón del sistema.
 *
 * Sobre por qué el primario es navy y no rojo: la regla del sistema es que el
 * rojo de marca solo se usa en carga tipográfica grande o en el isotipo,
 * porque no pasa contraste. Blanco sobre `#F52125` da 4.09:1, por debajo del
 * 4.5:1 que pide AA para texto normal. El navy, en cambio, es el color que el
 * sistema define para superficies y da 13.99:1.
 *
 * La variante `accent` sí lleva el rojo, para el CTA principal de una pantalla.
 * Su rótulo va fijo en 19px Bold: por encima del umbral de texto grande, donde
 * 4.09:1 sí cumple. No bajar ese tamaño.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;

  const label = (
    <Text
      style={[styles.label, variant === 'accent' && styles.accentLabel]}
      numberOfLines={1}
    >
      {title}
    </Text>
  );

  const content = loading ? <ActivityIndicator color={Palette.white} /> : label;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.wrap,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[...Gradients.navySolid.colors]}
          locations={[...Gradients.navySolid.locations]}
          start={Gradients.navySolid.start}
          end={Gradients.navySolid.end}
          style={styles.body}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.body, FILLS[variant]]}>{content}</View>
      )}
    </Pressable>
  );
}

const FILLS: Record<Exclude<ButtonVariant, 'primary'>, ViewStyle> = {
  accent: { backgroundColor: Palette.red },
  danger: { backgroundColor: Semantic.error },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Palette.navy,
  },
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    ...Effects.panelShadow,
  },
  body: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: Radius.pill,
  },
  label: {
    ...Type.body,
    fontFamily: FontFamily.semibold,
    color: Palette.white,
    letterSpacing: 0.3,
  },
  accentLabel: {
    // No bajar: 19px Bold es lo que hace admisible el blanco sobre el rojo.
    fontSize: 19,
    lineHeight: 24,
    fontFamily: FontFamily.bold,
  },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.45 },
});

/**
 * Variante `secondary` con rótulo en navy. Se separa del componente principal
 * porque es el único caso donde el texto no va en blanco.
 */
export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled || props.loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.wrap,
        { shadowOpacity: 0 },
        (props.disabled || props.loading) && styles.inactive,
        pressed && styles.pressed,
        props.style,
      ]}
    >
      <View style={[styles.body, FILLS.secondary]}>
        {props.loading ? (
          <ActivityIndicator color={Palette.navy} />
        ) : (
          <Text style={[styles.label, { color: Palette.navy }]} numberOfLines={1}>
            {props.title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
