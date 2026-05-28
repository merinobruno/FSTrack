import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type FormEntry = {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const FORMS: FormEntry[] = [
  {
    key: 'produccion',
    title: 'Producción de Leche',
    description: 'Registrar producción diaria por lote',
    icon: <AntDesign name="product" size={26} color="#6366f1" />,
    color: 'rgba(99,102,241,0.10)',
  },
  {
    key: 'nacimientos',
    title: 'Nacimientos',
    description: 'Registrar nacimientos de animales',
    icon: <MaterialCommunityIcons name="cow" size={26} color="#10b981" />,
    color: 'rgba(16,185,129,0.10)',
  },
  {
    key: 'muertes',
    title: 'Muertes',
    description: 'Registrar bajas de hacienda',
    icon: <MaterialCommunityIcons name="cow-off" size={26} color="#ef4444" />,
    color: 'rgba(239,68,68,0.10)',
  },
  {
    key: 'traslados',
    title: 'Traslados y Cambios de Categoría',
    description: 'Registrar traslados entre lotes o establecimientos',
    icon: <MaterialCommunityIcons name="swap-horizontal" size={26} color="#f59e0b" />,
    color: 'rgba(245,158,11,0.10)',
  },
  {
    key: 'novedades',
    title: 'Novedades de Sueldo',
    description: 'Registrar novedades para liquidacion de sueldos',
    icon: <MaterialCommunityIcons name="account-cash-outline" size={26} color="#0ea5e9" />,
    color: 'rgba(14,165,233,0.10)',
  },
];

export default function FormulariosIndex() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: Colors[colorScheme].background }}
    >
      <ThemedText style={s.hint}>Seleccioná el formulario a completar</ThemedText>

      {FORMS.map((form) => (
        <Pressable
          key={form.key}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: isDark ? 'rgba(128,128,128,0.10)' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#e5e7eb',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => router.push(`/(tabs)/formularios/${form.key}` as any)}
        >
          <View style={[s.iconBox, { backgroundColor: form.color }]}>
            {form.icon}
          </View>
          <View style={s.textBox}>
            <ThemedText style={s.cardTitle}>{form.title}</ThemedText>
            <ThemedText style={s.cardDesc}>{form.description}</ThemedText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={isDark ? '#4b5563' : '#d1d5db'}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { padding: 16, gap: 10, paddingBottom: 32 },
  hint:       { fontSize: 13, opacity: 0.5, marginBottom: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox:   { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '600' as const },
  cardDesc:  { fontSize: 12, opacity: 0.55 },
});
