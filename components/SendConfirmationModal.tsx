import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, SecondaryButton } from '@/components/brand';
import {
  Effects,
  FontFamily,
  Palette,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';

type Props = {
  visible: boolean;
  title?: string;
  payload: any;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

const isEmptyValue = (value: any) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

const prettifyKey = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\//g, ' / ')
    .trim();

const formatValue = (value: any) => {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{formatValue(value)}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function RenderPayload({
  data,
  parentKey,
}: {
  data: any;
  parentKey?: string;
}) {
  if (!data || typeof data !== 'object') return null;

  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (isEmptyValue(value)) return null;

        const label = prettifyKey(key);

        if (Array.isArray(value)) {
          return (
            <SectionCard
              key={`${parentKey || 'root'}-${key}`}
              title={label}
            >
              {value.map((item, index) => (
                <View key={index} style={styles.arrayItemCard}>
                  <Text style={styles.arrayItemTitle}>Ítem {index + 1}</Text>

                  {typeof item === 'object' && item !== null ? (
                    <RenderPayload data={item} parentKey={`${key}-${index}`} />
                  ) : (
                    <FieldRow label={label} value={item} />
                  )}
                </View>
              ))}
            </SectionCard>
          );
        }

        if (typeof value === 'object' && value !== null) {
          return (
            <SectionCard
              key={`${parentKey || 'root'}-${key}`}
              title={label}
            >
              <RenderPayload data={value} parentKey={key} />
            </SectionCard>
          );
        }

        return (
          <FieldRow
            key={`${parentKey || 'root'}-${key}`}
            label={label}
            value={value}
          />
        );
      })}
    </>
  );
}

export default function SendConfirmationModal({
  visible,
  title = '¿Estás seguro?',
  payload,
  onCancel,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.lead}>
              Revisá los datos antes de enviarlos a Finnegans.
            </Text>
          </View>

          <View style={styles.previewBox}>
            <ScrollView>
              <RenderPayload data={payload} />
            </ScrollView>
          </View>

          <View style={styles.actions}>
            {/* Cancelar iba en rojo pleno y confirmar en verde: invertía el
                peso visual sobre la acción destructiva y usaba dos colores
                fuera de paleta. */}
            <SecondaryButton
              title={cancelText}
              onPress={onCancel}
              style={styles.action}
            />
            <Button
              title={confirmText}
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 47, 67, 0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Palette.surfaceHigh,
    borderRadius: Radius.panel,
    borderWidth: 1.5,
    borderColor: Effects.hairline,
    padding: Spacing.lg,
    gap: Spacing.md,
    maxHeight: '85%',
    ...Effects.panelShadow,
  },
  head: { gap: Spacing.xs },
  title: {
    ...Type.title,
    fontFamily: FontFamily.bold,
    color: Palette.navy,
  },
  lead: {
    ...Type.label,
    color: Palette.steelText,
  },

  previewBox: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Effects.edge,
    borderRadius: Radius.field,
    padding: Spacing.md,
    minHeight: 220,
    maxHeight: 340,
  },

  fieldRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Effects.edge,
    gap: 2,
  },
  fieldLabel: {
    ...Type.micro,
    fontFamily: FontFamily.medium,
    color: Palette.steelText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldValue: {
    ...Type.label,
    fontFamily: FontFamily.semibold,
    color: Palette.ink,
  },

  sectionCard: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.field,
    backgroundColor: 'rgba(10, 47, 67, 0.04)',
    gap: 6,
  },
  sectionTitle: {
    ...Type.label,
    fontFamily: FontFamily.bold,
    color: Palette.navy,
  },
  arrayItemCard: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.field,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Effects.edge,
    gap: Spacing.xs,
  },
  arrayItemTitle: {
    ...Type.micro,
    fontFamily: FontFamily.bold,
    color: Palette.steelText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  action: { flex: 1 },
});
