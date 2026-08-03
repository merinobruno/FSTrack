import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';

import { PairedHeading } from './heading';
import { Chip } from './pill';
import { Panel, Screen } from './surfaces';
import {
  Effects,
  FontFamily,
  Palette,
  Radius,
  Semantic,
  Spacing,
  Type,
} from '@/constants/theme';

export type FormScreenProps = {
  /** Primera línea del titular pareado: nombra el formulario. */
  title: string;
  /** Segunda línea: lo califica. */
  subtitle: string;
  /** Empresa seleccionada, mostrada como chip bajo el titular. */
  company?: string | null;
  children: React.ReactNode;
};

/**
 * Andamiaje de las pantallas de carga.
 *
 * Reemplaza al `ParallaxScrollView` con un icono gigante blanco que traían los
 * formularios: ese encabezado no pertenece al sistema —que resuelve la
 * identidad de una pieza con el titular pareado sobre panel— y además gastaba
 * el tercio superior de la pantalla en una ilustración.
 */
export function FormScreen({ title, subtitle, company, children }: FormScreenProps) {
  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Panel style={styles.hero}>
            <PairedHeading line1={title} line2={subtitle} size="sm" />
            {company ? (
              <Chip label={company} />
            ) : (
              <View style={styles.noCompany}>
                <MaterialCommunityIcons
                  name="alert-outline"
                  size={14}
                  color={Semantic.pending}
                />
                <Text style={styles.noCompanyText}>
                  Sin empresa seleccionada — elegí una en Inicio
                </Text>
              </View>
            )}
          </Panel>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Bloque de campos con título de sección. */
export function FormSection({
  title,
  children,
  style,
  ...rest
}: ViewProps & { title?: string }) {
  return (
    <Panel style={[styles.section, style]} {...rest}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </Panel>
  );
}

export type ItemCardProps = {
  index: number;
  total: number;
  onRemove?: () => void;
  children: React.ReactNode;
};

/**
 * Ítem repetible de un formulario.
 *
 * El contador `n / N` retoma el paginador de las piezas: dos cápsulas
 * contiguas arriba a la derecha del panel.
 */
export function ItemCard({ index, total, onRemove, children }: ItemCardProps) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>Ítem</Text>
        <View style={styles.itemMeta}>
          <Chip label={`${index + 1} / ${total}`} />
          {onRemove ? (
            <Pressable
              onPress={onRemove}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ítem ${index + 1}`}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={Semantic.error}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.itemBody}>{children}</View>
    </View>
  );
}

/**
 * Subgrupo dentro de un ítem (Origen / Destino / Movimiento). El rótulo va en
 * versalita sobre una línea de filo, para separar sin agregar otra caja.
 */
export function ItemGroup({
  label,
  children,
  style,
  ...rest
}: ViewProps & { label: string }) {
  return (
    <View style={[styles.group, style]} {...rest}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
  },
  hero: { gap: Spacing.md, alignItems: 'flex-start' },
  noCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noCompanyText: {
    ...Type.caption,
    fontFamily: FontFamily.medium,
    color: Semantic.pending,
  },

  section: { gap: Spacing.md },
  sectionTitle: {
    ...Type.section,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
  },

  item: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Effects.edge,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    ...Type.label,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemBody: { gap: Spacing.md },

  group: {
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Effects.hairline,
    paddingTop: Spacing.md,
  },
  groupLabel: {
    ...Type.micro,
    fontFamily: FontFamily.bold,
    color: Palette.steelText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
