import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { NavCard, PairedHeading, Panel, Screen } from '@/components/brand';
import { Palette, Spacing } from '@/constants/theme';
import { useWorkflow } from '@/contexts/WorkflowContext';

const FORMS = [
  {
    key: 'compra' as const,
    title: 'Pedido de Compra',
    description: 'Registrar un pedido de compra de materiales',
    icon: 'cart-outline' as const,
  },
  {
    key: 'venta' as const,
    title: 'Pedido de Venta',
    description: 'Registrar un pedido de venta a clientes',
    icon: 'tag-outline' as const,
  },
];

export default function PedidosIndex() {
  const { workflow, loadingWorkflow } = useWorkflow();

  const isEnabled = (key: 'compra' | 'venta') =>
    key === 'compra' ? !!workflow.compra : !!workflow.venta;

  if (loadingWorkflow) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Palette.navy} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Panel>
          <PairedHeading line1="PEDIDOS" line2="compra y venta" size="sm" />
        </Panel>

        <View style={styles.list}>
          {FORMS.map((form) => {
            const enabled = isEnabled(form.key);
            return (
              <NavCard
                key={form.key}
                icon={form.icon}
                title={form.title}
                description={
                  enabled
                    ? form.description
                    : 'Sin workflow asignado — contactá al administrador'
                }
                disabled={!enabled}
                onPress={() => router.push(`/(tabs)/pedidos/${form.key}` as any)}
              />
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  list: { gap: Spacing.md },
});
