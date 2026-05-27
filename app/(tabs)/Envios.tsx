import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { Fonts } from '@/constants/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const FORM_LABELS: Record<string, string> = {
  PRODUCCION:  'Producción',
  NACIMIENTOS: 'Nacimientos',
  MUERTES:     'Muertes',
  TRASLADOS:   'Traslados',
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
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: LogEntry['status'] }) {
  const config = status === 'SUCCESS'
    ? { label: 'Enviado', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)', text: '#059669' }
    : { label: 'Error',   bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.3)',  text: '#b91c1c' };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <ThemedText style={[styles.badgeText, { color: config.text }]}>{config.label}</ThemedText>
    </View>
  );
}

function LogItem({ item }: { item: LogEntry }) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.item, { borderColor: isDark ? '#2a2a2a' : '#e5e7eb' }]}>
      <View style={styles.itemHeader}>
        <ThemedText style={styles.itemFormType}>
          {FORM_LABELS[item.form_type] ?? item.form_type}
        </ThemedText>
        <StatusBadge status={item.status} />
      </View>

      {item.company_label && (
        <ThemedText style={styles.itemMeta}>{item.company_label}</ThemedText>
      )}
      {item.lote && (
        <ThemedText style={styles.itemMeta}>Lote: {item.lote}</ThemedText>
      )}
      <ThemedText style={styles.itemDate}>{formatDate(item.created_at)}</ThemedText>

      {item.status === 'ERROR' && item.error_detail && (
        <ThemedText style={styles.itemError}>{item.error_detail}</ThemedText>
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
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <MaterialCommunityIcons
          name="clipboard-list-outline"
          size={200}
          color="white"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleRow}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Envíos
        </ThemedText>
        {pending > 0 && (
          <View style={styles.pendingPill}>
            <ThemedText style={styles.pendingPillText}>{pending} pendiente{pending !== 1 ? 's' : ''}</ThemedText>
          </View>
        )}
      </ThemedView>

      <ThemedText>Historial de formularios enviados desde esta cuenta.</ThemedText>

      <ThemedView style={styles.actionsRow}>
        <Pressable
          style={[styles.syncBtn, { opacity: syncing ? 0.5 : 1 }]}
          onPress={async () => { await syncPending(); fetchLogs(); }}
          disabled={syncing}
        >
          {syncing
            ? <ActivityIndicator size="small" color="#6366f1" />
            : <ThemedText style={styles.syncBtnText}>Sincronizar pendientes</ThemedText>
          }
        </Pressable>
        <Pressable
          style={[styles.syncBtn, { opacity: loading ? 0.5 : 1, marginLeft: 8 }]}
          onPress={fetchLogs}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#6366f1" />
            : <ThemedText style={styles.syncBtnText}>Actualizar</ThemedText>
          }
        </Pressable>
      </ThemedView>

      {loading && logs.length === 0 ? (
        <ThemedView style={styles.empty}>
          <ActivityIndicator size="large" color="#6366f1" />
        </ThemedView>
      ) : logs.length === 0 ? (
        <ThemedView style={styles.empty}>
          <ThemedText style={styles.emptyText}>No hay envíos registrados aún.</ThemedText>
        </ThemedView>
      ) : (
        <View style={{ gap: 8, paddingBottom: 24 }}>
          {logs.map((item) => (
            <LogItem key={String(item.id)} item={item} />
          ))}
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { position: 'absolute' },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  pendingPill: {
    backgroundColor: 'rgba(234,179,8,0.15)',
    borderColor: 'rgba(234,179,8,0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  pendingPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ca8a04',
  },

  actionsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    backgroundColor: 'rgba(99,102,241,0.08)',
    minWidth: 48,
    justifyContent: 'center',
  },

  syncBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6366f1',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  emptyText: {
    fontSize: 14,
    opacity: 0.5,
  },

  item: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    backgroundColor: 'rgba(128,128,128,0.04)',
  },

  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  itemFormType: {
    fontSize: 15,
    fontWeight: '600' as const,
  },

  itemMeta: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },

  itemDate: {
    fontSize: 12,
    opacity: 0.45,
    marginTop: 2,
  },

  itemError: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 4,
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
