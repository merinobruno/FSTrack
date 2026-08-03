import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { FontFamily, Gradients, Palette, Radius, Type } from '@/constants/theme';

export type PillProps = ViewProps & {
  label: string;
  /**
   * Sangra el pill fuera del margen izquierdo hasta el borde de la pantalla.
   * Es intencional en el sistema: ancla la composición.
   */
  bleed?: boolean;
};

/**
 * Pill de sección. El degradé navy es la firma visual del sistema y siempre va
 * de claro a oscuro en el sentido de lectura.
 */
export function Pill({ label, bleed = false, style, ...rest }: PillProps) {
  return (
    <View style={[styles.pillWrap, bleed && styles.bleed, style]} {...rest}>
      <LinearGradient
        colors={[...Gradients.navy.colors]}
        locations={[...Gradients.navy.locations]}
        start={Gradients.navy.start}
        end={Gradients.navy.end}
        style={[styles.pill, bleed && styles.pillBleed]}
      >
        <Text style={styles.pillLabel} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}

/**
 * Chip de paginación o contador. Cápsula en degradé acero con texto en tinta.
 */
export function Chip({ label, style, ...rest }: { label: string } & ViewProps) {
  return (
    <LinearGradient
      colors={[...Gradients.chip.colors]}
      locations={[...Gradients.chip.locations]}
      start={Gradients.chip.start}
      end={Gradients.chip.end}
      style={[styles.chip, style]}
      {...rest}
    >
      <Text style={styles.chipLabel}>{label}</Text>
    </LinearGradient>
  );
}

export type TabProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

/**
 * Tab del panel. La activa lleva el degradé navy; la inactiva va en acero
 * sólido. Ambas con texto blanco Bold y radio solo en las esquinas de arriba.
 */
export function Tab({ label, active = false, onPress }: TabProps) {
  const body = (
    <Text style={styles.tabLabel} numberOfLines={1}>
      {label}
    </Text>
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {active ? (
        <LinearGradient
          colors={[...Gradients.navySolid.colors]}
          locations={[...Gradients.navySolid.locations]}
          start={Gradients.navySolid.start}
          end={Gradients.navySolid.end}
          style={styles.tab}
        >
          {body}
        </LinearGradient>
      ) : (
        <View style={[styles.tab, styles.tabInactive]}>{body}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pillWrap: { alignSelf: 'flex-start' },
  bleed: { marginLeft: -16 },
  pill: {
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 21,
  },
  pillBleed: {
    // Sangrado: la cápsula se corta al ras del borde izquierdo.
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    paddingLeft: 28,
  },
  pillLabel: {
    ...Type.pill,
    fontFamily: FontFamily.medium,
    color: Palette.white,
    letterSpacing: 0.4,
  },
  chip: {
    borderRadius: Radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  chipLabel: {
    ...Type.caption,
    fontFamily: FontFamily.semibold,
    color: Palette.ink,
  },
  tab: {
    borderTopLeftRadius: Radius.tab,
    borderTopRightRadius: Radius.tab,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabInactive: { backgroundColor: Palette.steel },
  tabLabel: {
    ...Type.caption,
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  pressed: { opacity: 0.8 },
});
