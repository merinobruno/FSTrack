import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { NavCard, PairedHeading, Panel, Screen } from '@/components/brand';
import { Spacing } from '@/constants/theme';

type FormEntry = {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const FORMS: FormEntry[] = [
  {
    key: 'produccion',
    title: 'Producción de Leche',
    description: 'Registrar producción diaria por lote',
    icon: 'water-outline',
  },
  {
    key: 'nacimientos',
    title: 'Nacimientos',
    description: 'Registrar nacimientos de animales',
    icon: 'cow',
  },
  {
    key: 'muertes',
    title: 'Muertes',
    description: 'Registrar bajas de hacienda',
    icon: 'cow-off',
  },
  {
    key: 'traslados',
    title: 'Traslados y Cambios de Categoría',
    description: 'Registrar traslados entre lotes o establecimientos',
    icon: 'swap-horizontal',
  },
  {
    key: 'novedades',
    title: 'Novedades de Sueldo',
    description: 'Registrar novedades para liquidación de sueldos',
    icon: 'account-cash-outline',
  },
];

export default function FormulariosIndex() {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Panel>
          <PairedHeading line1="FORMULARIOS" line2="de hacienda" size="sm" />
        </Panel>

        <View style={styles.list}>
          {FORMS.map((form) => (
            <NavCard
              key={form.key}
              icon={form.icon}
              title={form.title}
              description={form.description}
              onPress={() => router.push(`/(tabs)/formularios/${form.key}` as any)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  list: { gap: Spacing.md },
});
