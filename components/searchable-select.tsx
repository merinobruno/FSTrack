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

import {
  Effects,
  FontFamily,
  Palette,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';

export type SelectOption = { label: string; value: string };

type Props = {
  label: string;
  selectedValue: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  optional?: boolean;
};

const INITIAL_LIMIT = 20;

export function SearchableSelect({
  label,
  selectedValue,
  options,
  onValueChange,
  placeholder = 'Seleccionar...',
  loading = false,
  optional = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === selectedValue);
  const filtered = query.trim()
    ? (() => {
        const queryTerms = query.trim().toLowerCase().split(/[\s,·()\-\/]+/).filter(Boolean);
        return options.filter((o) => {
          const tokens = `${o.label} ${o.value}`.toLowerCase().split(/[\s,·()\-\/]+/);
          return queryTerms.every((qt) => tokens.some((t) => t.startsWith(qt)));
        });
      })()
    : options.slice(0, INITIAL_LIMIT);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={s.wrap}>
      <View style={s.labelRow}>
        <Text style={s.label}>{label}</Text>
        {optional ? <Text style={s.optional}>opcional</Text> : null}
      </View>

      <Pressable
        style={({ pressed }) => [s.trigger, pressed && s.triggerPressed]}
        onPress={() => {
          if (!loading) setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Palette.navy} />
        ) : (
          <>
            <Text
              style={[s.triggerText, !selected && s.triggerPlaceholder]}
              numberOfLines={1}
            >
              {selected?.label ?? placeholder}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={Palette.navy}
            />
          </>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />

          <View style={s.sheet}>
            <View style={s.grabber} />

            <Text style={s.sheetTitle}>{label}</Text>

            <View style={s.searchRow}>
              <MaterialCommunityIcons name="magnify" size={18} color={Palette.steelText} />
              <TextInput
                style={s.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar..."
                placeholderTextColor={Palette.steelText}
                autoFocus
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={16}
                    color={Palette.steelText}
                  />
                </Pressable>
              )}
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.list}>
              <Pressable
                style={s.option}
                onPress={() => {
                  onValueChange('');
                  close();
                }}
              >
                <Text style={[s.optionText, s.optionPlaceholder]}>{placeholder}</Text>
              </Pressable>

              {filtered.map((o) => {
                const isSelected = o.value === selectedValue;
                return (
                  <Pressable
                    key={o.value}
                    style={[s.option, isSelected && s.optionSelected]}
                    onPress={() => {
                      onValueChange(o.value);
                      close();
                    }}
                  >
                    <Text
                      style={[s.optionText, isSelected && s.optionTextSelected]}
                    >
                      {o.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={Palette.navy}
                      />
                    )}
                  </Pressable>
                );
              })}

              {!query.trim() && options.length > INITIAL_LIMIT && (
                <View style={s.empty}>
                  <Text style={s.emptyText}>
                    Mostrando {INITIAL_LIMIT} de {options.length} — buscá para filtrar
                  </Text>
                </View>
              )}

              {filtered.length === 0 && (
                <View style={s.empty}>
                  <Text style={s.emptyText}>Sin resultados</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    ...Type.label,
    fontFamily: FontFamily.medium,
    color: Palette.navy,
  },
  optional: {
    ...Type.micro,
    color: Palette.steelText,
    fontStyle: 'italic',
  },

  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 46,
    paddingHorizontal: 14,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Effects.edge,
    borderRadius: Radius.field,
  },
  triggerPressed: { borderColor: Palette.navy },
  triggerText: {
    flex: 1,
    ...Type.body,
    fontFamily: FontFamily.regular,
    color: Palette.ink,
  },
  triggerPlaceholder: { color: Palette.steelText },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 47, 67, 0.45)',
  },
  sheet: {
    backgroundColor: Palette.surfaceHigh,
    borderTopLeftRadius: Radius.panel,
    borderTopRightRadius: Radius.panel,
    borderTopWidth: 1.5,
    borderColor: Effects.hairline,
    maxHeight: '70%',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: Palette.steel,
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    ...Type.section,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Effects.edge,
    borderRadius: Radius.field,
  },
  searchInput: {
    flex: 1,
    ...Type.body,
    fontFamily: FontFamily.regular,
    color: Palette.ink,
    paddingVertical: 0,
  },

  list: { paddingBottom: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Effects.hairline,
  },
  optionSelected: { backgroundColor: 'rgba(10, 47, 67, 0.06)' },
  optionText: {
    flex: 1,
    ...Type.body,
    fontFamily: FontFamily.regular,
    color: Palette.ink,
  },
  optionPlaceholder: { color: Palette.steelText },
  optionTextSelected: {
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
  },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: {
    ...Type.label,
    color: Palette.steelText,
  },
});
