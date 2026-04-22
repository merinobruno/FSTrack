import React from 'react';
import {
  Modal,
  Platform,
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
            Revisa los datos antes de enviarlos a Finnegans.
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
              <ThemedText style={styles.previewText}>
                {JSON.stringify(payload, null, 2)}
              </ThemedText>
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
  previewText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      web: 'monospace',
    }),
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
    backgroundColor: '#bdbdbd',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});