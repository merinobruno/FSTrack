import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

export type SelectOption = { label: string; value: string };

type Props = {
  label: string;
  selectedValue: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
};

export function SearchableSelect({
  label,
  selectedValue,
  options,
  onValueChange,
  placeholder = 'Seleccionar...',
  loading = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#1f1f1f' : '#ebebeb';
  const textColor = isDark ? '#fff' : '#111';
  const subtleColor = isDark ? '#9ca3af' : '#6b7280';
  const sheetBg = isDark ? '#1c1c1e' : '#fff';
  const dividerColor = isDark ? '#2c2c2e' : '#f0f0f0';
  const searchBg = isDark ? '#2c2c2e' : '#f2f2f7';

  const selected = options.find((o) => o.value === selectedValue);
  const filtered = query.trim()
    ? (() => {
        const q = query.trim().toLowerCase();
        return options.filter((o) => {
          const tokens = `${o.label} ${o.value}`.toLowerCase().split(/[\s,·()\-\/]+/);
          return tokens.some((t) => t.startsWith(q));
        });
      })()
    : options;

  const close = () => { setOpen(false); setQuery(''); };

  return (
    <>
      <ThemedText>{label}</ThemedText>
      <Pressable
        style={[s.trigger, { backgroundColor: bg }]}
        onPress={() => { if (!loading) setOpen(true); }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={subtleColor} />
        ) : (
          <>
            <Text
              style={[s.triggerText, { color: selected ? textColor : subtleColor }]}
              numberOfLines={1}
            >
              {selected?.label ?? placeholder}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={subtleColor} />
          </>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={[s.sheet, { backgroundColor: sheetBg }]}>

            {/* Search bar */}
            <View style={[s.searchRow, { backgroundColor: searchBg }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={subtleColor} />
              <TextInput
                style={[s.searchInput, { color: textColor }]}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar..."
                placeholderTextColor={subtleColor}
                autoFocus
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={subtleColor} />
                </Pressable>
              )}
            </View>

            {/* Options list */}
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.list}>
              {/* Clear / placeholder row */}
              <Pressable
                style={[s.option, { borderBottomColor: dividerColor }]}
                onPress={() => { onValueChange(''); close(); }}
              >
                <Text style={[s.optionText, { color: subtleColor }]}>{placeholder}</Text>
              </Pressable>

              {filtered.map((o) => {
                const isSelected = o.value === selectedValue;
                return (
                  <Pressable
                    key={o.value}
                    style={[
                      s.option,
                      { borderBottomColor: dividerColor },
                      isSelected && s.optionSelected,
                    ]}
                    onPress={() => { onValueChange(o.value); close(); }}
                  >
                    <Text style={[s.optionText, { color: textColor }, isSelected && s.optionTextSelected]}>
                      {o.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={18} color="#6366f1" />
                    )}
                  </Pressable>
                );
              })}

              {filtered.length === 0 && (
                <View style={s.empty}>
                  <Text style={{ color: subtleColor, fontSize: 14 }}>Sin resultados</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    borderRadius: 10,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '65%',
    paddingTop: 8,
    paddingBottom: 32,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  list: {
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionSelected: {
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#6366f1',
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
