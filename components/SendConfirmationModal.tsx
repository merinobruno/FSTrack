import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <ThemedText style={styles.fieldValue}>{formatValue(value)}</ThemedText>
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
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
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
                  <ThemedText style={styles.arrayItemTitle}>
                    Item {index + 1}
                  </ThemedText>

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
  title = 'Are you sure?',
  payload,
  onCancel,
  onConfirm,
  confirmText = 'Send',
  cancelText = 'Cancel',
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#1c1c1e' : '#fff',
              borderColor: isDark ? '#3a3a3c' : '#ddd',
            },
          ]}
        >
          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText>
            Revisá los datos antes de enviarlos a Finnegans.
          </ThemedText>

          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: isDark ? '#111' : '#f7f7f7',
                borderColor: isDark ? '#3a3a3c' : '#ddd',
              },
            ]}
          >
            <ScrollView>
              <RenderPayload data={payload} />
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <ThemedText style={styles.buttonText}>{cancelText}</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <ThemedText style={styles.buttonText}>{confirmText}</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    maxHeight: '80%',
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 220,
    maxHeight: 350,
  },
  fieldRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    gap: 2,
  },
  fieldLabel: {
    fontSize: 12,
    opacity: 0.75,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(128,128,128,0.08)',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  arrayItemCard: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(128,128,128,0.06)',
    gap: 4,
  },
  arrayItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  button: {
    minHeight: 42,
    minWidth: 100,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  cancelButton: {
    backgroundColor: '#ff0000',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});