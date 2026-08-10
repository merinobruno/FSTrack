import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
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
  Motion,
  Palette,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  /**
   * El `Modal` se monta con `animationType="none"` y la entrada se anima a
   * mano. Con `"slide"` la animación arrastra todo el contenido del modal,
   * incluido el fondo oscurecedor, así que el velo entraba deslizándose como
   * un rectángulo en lugar de fundirse. Acá el fondo funde y solo la hoja
   * sube, que es el mismo patrón que usa `envios-drawer`.
   */
  const [mounted, setMounted] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(SCREEN_HEIGHT * 0.7);
  const progress = useRef(new Animated.Value(0)).current;
  const hasOpened = useRef(false);

  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: Motion.sheet,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    // En el primer render `open` ya es false; sin este corte se dispararía
    // una animación de salida sobre un modal que nunca se abrió.
    if (!hasOpened.current) return;

    Animated.timing(progress, {
      toValue: 0,
      duration: Motion.sheet * 0.8,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Solo desmontar si la animación llegó al final: si el usuario reabrió
      // el selector a mitad de camino, `finished` es false y desmontar
      // cerraría el modal que se acaba de pedir.
      if (finished) {
        setMounted(false);
        setQuery('');
      }
    });
  }, [open, progress]);

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

  // El limpiado de la búsqueda ocurre al terminar la animación de salida, no
  // acá: si se limpiara de inmediato, la lista se repoblaría a la vista
  // mientras la hoja todavía está bajando.
  const close = () => setOpen(false);

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

      <Modal
        visible={mounted}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={s.overlay}>
          <Animated.View style={[s.backdrop, { opacity: progress }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          </Animated.View>

          <Animated.View
            style={[
              s.sheet,
              {
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [sheetHeight, 0],
                    }),
                  },
                ],
              },
            ]}
            onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          >
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
          </Animated.View>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
