import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { FontFamily, Radius, Semantic, Spacing, Type } from '@/constants/theme';

export type StatusVariant = 'success' | 'pending' | 'error' | 'info';

export type StatusBoxProps = ViewProps & {
  variant: StatusVariant;
  title: string;
  detail?: string | null;
};

const VARIANTS = {
  success: {
    color: Semantic.success,
    tint: Semantic.successTint,
    edge: Semantic.successEdge,
    icon: 'check-circle-outline',
  },
  pending: {
    color: Semantic.pending,
    tint: Semantic.pendingTint,
    edge: Semantic.pendingEdge,
    icon: 'clock-outline',
  },
  error: {
    color: Semantic.error,
    tint: Semantic.errorTint,
    edge: Semantic.errorEdge,
    icon: 'alert-circle-outline',
  },
  info: {
    color: Semantic.info,
    tint: Semantic.infoTint,
    edge: Semantic.infoEdge,
    icon: 'information-outline',
  },
} as const;

/**
 * Caja de estado de envío.
 *
 * Reemplaza a los bloques success/queue/error que estaban duplicados
 * literalmente en siete pantallas, cada uno con su propio rojo y su propio
 * verde. Acá el color sale de `Semantic`, que es un único juego verificado AA
 * sobre el gris del sistema.
 *
 * A diferencia del error original —texto blanco sobre `#dc2626` pleno— la caja
 * va tintada con una barra de color al costado: el rojo pleno competía con el
 * rojo de marca, que es el acento y no un estado.
 */
export function StatusBox({ variant, title, detail, style, ...rest }: StatusBoxProps) {
  const v = VARIANTS[variant];

  return (
    <View
      style={[styles.box, { backgroundColor: v.tint, borderColor: v.edge }, style]}
      accessibilityRole="alert"
      {...rest}
    >
      <View style={[styles.bar, { backgroundColor: v.color }]} />
      <MaterialCommunityIcons name={v.icon} size={20} color={v.color} style={styles.icon} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: v.color }]}>{title}</Text>
        {detail ? <Text style={[styles.detail, { color: v.color }]}>{detail}</Text> : null}
      </View>
    </View>
  );
}

/**
 * Cápsula de estado para listas de envíos. Misma paleta semántica que
 * `StatusBox`, en tamaño de badge.
 */
export function StatusBadge({ variant, label }: { variant: StatusVariant; label: string }) {
  const v = VARIANTS[variant];

  return (
    <View style={[styles.badge, { backgroundColor: v.tint, borderColor: v.edge }]}>
      <Text style={[styles.badgeText, { color: v.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    ...Type.micro,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.2,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.field,
    padding: Spacing.md,
    paddingLeft: Spacing.md + 6,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  icon: { marginTop: 1 },
  text: { flex: 1, gap: 3 },
  title: {
    ...Type.label,
    fontFamily: FontFamily.semibold,
  },
  detail: {
    ...Type.caption,
    opacity: 0.85,
  },
});
