import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Chip,
  PairedHeading,
  Panel,
  Screen,
  SecondaryButton,
  StatusBadge,
} from '@/components/brand';
import { API_BASE_URL } from '@/constants/api';
import {
  Effects,
  FontFamily,
  Palette,
  Radius,
  Semantic,
  Spacing,
  Type,
} from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';

const FORM_LABELS: Record<string, string> = {
  PRODUCCION: 'Producción',
  NACIMIENTOS: 'Nacimientos',
  MUERTES: 'Muertes',
  TRASLADOS: 'Traslados',
  PEDIDO_COMPRA: 'Pedido Compra',
  PEDIDO_VENTA: 'Pedido Venta',
  NOVEDADES_SUELDO: 'Novedades de Sueldo',
};

type LogEntry = {
  id: number;
  form_type: string;
  lote: string | null;
  categoria: string | null;
  cantidad: number | null;
  deposito: string | null;
  company_label: string | null;
  status: 'SUCCESS' | 'ERROR';
  error_detail: string | null;
  created_at: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }) +
    ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  );
}

function LogItem({ item }: { item: LogEntry }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemFormType}>
          {FORM_LABELS[item.form_type] ?? item.form_type}
        </Text>
        <StatusBadge
          variant={item.status === 'SUCCESS' ? 'success' : 'error'}
          label={item.status === 'SUCCESS' ? 'Enviado' : 'Error'}
        />
      </View>

      {item.company_label && <Text style={styles.itemMeta}>{item.company_label}</Text>}
      {item.lote && <Text style={styles.itemMeta}>Lote: {item.lote}</Text>}
      <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>

      {item.status === 'ERROR' && item.error_detail && (
        <Text style={styles.itemError}>{item.error_detail}</Text>
      )}
    </View>
  );
}

export default function EnviosScreen() {
  const { user } = useAuth();
  const { submissions, syncing, syncPending } = useSubmissions();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const pending = submissions.filter((s) => s.status === 'PENDING').length;

  const fetchLogs = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/log/mine`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {}
    setLoading(false);
  }, [user?.token]);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Panel style={styles.hero}>
          <PairedHeading line1="ENVÍOS" line2="historial" size="sm" />
          {pending > 0 && (
            <Chip label={`${pending} pendiente${pending !== 1 ? 's' : ''}`} />
          )}
          <Text style={styles.lead}>
            Formularios enviados desde esta cuenta.
          </Text>
        </Panel>

        <View style={styles.actions}>
          <SecondaryButton
            title="Sincronizar pendientes"
            onPress={async () => {
              await syncPending();
              fetchLogs();
            }}
            loading={syncing}
            style={styles.action}
          />
          <SecondaryButton
            title="Actualizar"
            onPress={fetchLogs}
            loading={loading}
            style={styles.action}
          />
        </View>

        {loading && logs.length === 0 ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={Palette.navy} />
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay envíos registrados aún.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {logs.map((item) => (
              <LogItem key={String(item.id)} item={item} />
            ))}
          </View>
        )}
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
  hero: { gap: Spacing.md, alignItems: 'flex-start' },
  lead: {
    ...Type.label,
    color: Palette.steelText,
  },

  actions: { flexDirection: 'row', gap: Spacing.md },
  action: { flex: 1 },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: {
    ...Type.label,
    color: Palette.steelText,
  },

  list: { gap: Spacing.md },
  item: {
    backgroundColor: Palette.surfaceHigh,
    borderWidth: 1.5,
    borderColor: Effects.hairline,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: 3,
    ...Effects.panelShadow,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  itemFormType: {
    ...Type.body,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
    flexShrink: 1,
  },
  itemMeta: {
    ...Type.caption,
    color: Palette.steelText,
  },
  itemDate: {
    ...Type.micro,
    color: Palette.steelText,
  },
  itemError: {
    ...Type.caption,
    color: Semantic.error,
    marginTop: Spacing.xs,
  },
});
