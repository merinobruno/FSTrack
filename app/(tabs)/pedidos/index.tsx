import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type FormEntry = {
  key: 'compra' | 'venta';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const FORMS: FormEntry[] = [
  {
    key: 'compra',
    title: 'Pedido de Compra',
    description: 'Registrar un pedido de compra de materiales',
    icon: <MaterialCommunityIcons name="cart-outline" size={26} color="#3b82f6" />,
    color: 'rgba(59,130,246,0.10)',
  },
  {
    key: 'venta',
    title: 'Pedido de Venta',
    description: 'Registrar un pedido de venta a clientes',
    icon: <MaterialCommunityIcons name="tag-outline" size={26} color="#10b981" />,
    color: 'rgba(16,185,129,0.10)',
  },
];

export default function PedidosIndex() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { workflow, loadingWorkflow } = useWorkflow();

  const isEnabled = (key: 'compra' | 'venta') =>
    key === 'compra' ? !!workflow.compra : !!workflow.venta;

  if (loadingWorkflow) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: Colors[colorScheme].background }}
    >
      <ThemedText style={s.hint}>Seleccioná el tipo de pedido</ThemedText>

      {FORMS.map((form) => {
        const enabled = isEnabled(form.key);
        return (
          <Pressable
            key={form.key}
            style={({ pressed }) => [
              s.card,
              {
                backgroundColor: isDark ? 'rgba(128,128,128,0.10)' : '#ffffff',
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#e5e7eb',
                opacity: !enabled ? 0.45 : pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => enabled && router.push(`/(tabs)/pedidos/${form.key}` as any)}
          >
            <View style={[s.iconBox, { backgroundColor: form.color }]}>
              {form.icon}
            </View>
            <View style={s.textBox}>
              <ThemedText style={s.cardTitle}>{form.title}</ThemedText>
              <ThemedText style={s.cardDesc}>
                {enabled ? form.description : 'Sin workflow asignado — contactá al administrador'}
              </ThemedText>
            </View>
            <MaterialCommunityIcons
              name={enabled ? 'chevron-right' : 'lock-outline'}
              size={20}
              color={isDark ? '#4b5563' : '#d1d5db'}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
