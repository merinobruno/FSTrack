import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Isotipo,
  PairedHeading,
  Panel,
  Pill,
  Screen,
  SecondaryButton,
} from '@/components/brand';
import { SearchableSelect } from '@/components/searchable-select';
import { Effects, FontFamily, Palette, Spacing, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const {
    companies,
    selectedCompany,
    setSelectedCompanyByValue,
    loadingCompanies,
    clearSelectedCompany,
  } = useCompany();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pill label="INICIO" bleed />

        <Panel style={styles.hero}>
          {/* El isotipo al corte hace de marca de agua, como los arcos
              recortados de la portada de las piezas gráficas. */}
          <View style={styles.watermark} pointerEvents="none">
            <Isotipo size={150} />
          </View>

          <PairedHeading line1="FSTRACK" line2="Panel de carga" />
          <Text style={styles.claim}>Formularios de hacienda</Text>
        </Panel>

        <Panel style={styles.block}>
          <Text style={styles.blockTitle}>Empresa</Text>

          {/* El `Picker` nativo no acepta tipografía ni color desde estilos, así
              que quedaba como el único control fuera del sistema. Se usa el
              mismo selector buscable que el resto de la app, que además hace
              manejable una lista larga de establecimientos. */}
          <SearchableSelect
            label="Establecimiento"
            selectedValue={selectedCompany?.value ?? ''}
            options={companies}
            onValueChange={setSelectedCompanyByValue}
            placeholder="Seleccionar empresa..."
            loading={loadingCompanies}
          />

          {!selectedCompany && (
            <Text style={styles.unselected}>No hay empresa seleccionada.</Text>
          )}
        </Panel>

        {user && (
          <Panel style={styles.block}>
            <Text style={styles.blockTitle}>Sesión</Text>

            <View style={styles.rows}>
              <Row label="Dominio" value={user.workspace} />
              <Row label="Cuenta" value={user.cuenta} />
            </View>

            <SecondaryButton
              title="Cerrar sesión"
              onPress={async () => {
                await clearSelectedCompany();
                await signOut();
                router.replace('/login');
              }}
            />
          </Panel>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  hero: {
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -46,
    bottom: -38,
    opacity: 0.07,
  },
  claim: {
    ...Type.body,
    fontFamily: FontFamily.italic,
    color: Palette.ink,
    textAlign: 'right',
  },
  block: { gap: Spacing.md },
  blockTitle: {
    ...Type.section,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
  },
  unselected: {
    ...Type.label,
    fontFamily: FontFamily.italic,
    color: Palette.steelText,
  },
  rows: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Effects.hairline,
    paddingBottom: 6,
  },
  rowLabel: {
    ...Type.label,
    fontFamily: FontFamily.medium,
    color: Palette.steelText,
  },
  rowValue: {
    ...Type.body,
    fontFamily: FontFamily.semibold,
    color: Palette.ink,
    flexShrink: 1,
  },
});
