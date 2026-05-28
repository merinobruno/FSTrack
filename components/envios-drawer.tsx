import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/constants/api';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import PendingReviewModal from '@/components/pending-review-modal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.88, 420);

const FORM_LABELS: Record<string, string> = {
  PRODUCCION:  'Producción',
  NACIMIENTOS: 'Nacimientos',
  MUERTES:     'Muertes',
  TRASLADOS:   'Traslados',
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
    d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  );
}

function StatusBadge({ status }: { status: LogEntry['status'] }) {
  const cfg = status === 'SUCCESS'
    ? { label: 'Enviado', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)', text: '#059669' }
    : { label: 'Error',   bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.3)',  text: '#b91c1c' };
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <ThemedText style={[s.badgeText, { color: cfg.text }]}>{cfg.label}</ThemedText>
    </View>
  );
}

function LogItem({ item, isDark }: { item: LogEntry; isDark: boolean }) {
  return (
    <View style={[s.item, { borderColor: isDark ? '#2a2a2a' : '#e5e7eb' }]}>
      <View style={s.itemHeader}>
        <ThemedText style={s.itemType}>{FORM_LABELS[item.form_type] ?? item.form_type}</ThemedText>
        <StatusBadge status={item.status} />
      </View>
      {item.company_label && <ThemedText style={s.itemMeta}>{item.company_label}</ThemedText>}
      {item.lote        && <ThemedText style={s.itemMeta}>Lote: {item.lote}</ThemedText>}
      <ThemedText style={s.itemDate}>{formatDate(item.created_at)}</ThemedText>
      {item.status === 'ERROR' && item.error_detail && (
        <ThemedText style={s.itemError}>{item.error_detail}</ThemedText>
      )}
    </View>
  );
}

type Props = { visible: boolean; onClose: () => void };

export default function EnviosDrawer({ visible, onClose }: Props) {
  const { user } = useAuth();
  const { submissions } = useSubmissions();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const slideAnim   = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const pending = submissions.filter((s) => s.status === 'PENDING').length;

  const fetchLogs = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/log/mine`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) setLogs(await res.json());
    } catch {}
    setLoading(false);
  }, [user?.token]);

  useEffect(() => {
    if (visible) {
      setModalOpen(true);
      fetchLogs();
      Animated.parallel([
        Animated.spring(slideAnim,    { toValue: 0,           useNativeDriver: true, tension: 72, friction: 11 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim,    { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0,            duration: 180, useNativeDriver: true }),
      ]).start(() => setModalOpen(false));
    }
  }, [visible]);

  const bg       = isDark ? '#111827' : '#f9fafb';
  const headerBg = isDark ? '#1f2937' : '#ffffff';
  const border   = isDark ? '#374151' : '#e5e7eb';

  return (
    <>
    <Modal visible={modalOpen} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.overlay}>
        <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[s.drawer, { width: DRAWER_WIDTH, backgroundColor: bg, transform: [{ translateX: slideAnim }] }]}>

          {/* Header */}
          <View style={[s.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
            <View style={s.titleRow}>
              <ThemedText style={s.title}>Envíos</ThemedText>
              {pending > 0 && (
                <View style={s.pill}>
                  <ThemedText style={s.pillText}>{pending} pendiente{pending !== 1 ? 's' : ''}</ThemedText>
                </View>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={22} color={isDark ? '#9ca3af' : '#6b7280'} />
            </Pressable>
          </View>

          {/* Action buttons */}
          <View style={[s.actions, { borderBottomColor: border }]}>
            <Pressable
              style={[s.btn, pending === 0 && s.btnDisabled]}
              onPress={() => setReviewOpen(true)}
              disabled={pending === 0}
            >
              <ThemedText style={[s.btnText, pending === 0 && s.btnTextDisabled]}>
                Revisar y sincronizar
              </ThemedText>
            </Pressable>
            <Pressable
              style={[s.btn, { opacity: loading ? 0.5 : 1 }]}
              onPress={fetchLogs}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#6366f1" />
                : <ThemedText style={s.btnText}>Actualizar</ThemedText>}
            </Pressable>
          </View>

          {/* List */}
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {loading && logs.length === 0 ? (
              <View style={s.center}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : logs.length === 0 ? (
              <View style={s.center}>
                <MaterialCommunityIcons
                  name="clipboard-list-outline"
                  size={40}
                  color={isDark ? '#374151' : '#d1d5db'}
                />
                <ThemedText style={s.empty}>No hay envíos registrados aún.</ThemedText>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {logs.map((item) => <LogItem key={String(item.id)} item={item} isDark={isDark} />)}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>

    <PendingReviewModal
      visible={reviewOpen}
      onClose={() => { setReviewOpen(false); fetchLogs(); }}
    />
    </>
  );
}

const s = StyleSheet.create({
  overlay:  { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },

  drawer: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:    { fontSize: 18, fontWeight: '700' as const },

  pill: {
    backgroundColor: 'rgba(234,179,8,0.15)',
    borderColor: 'rgba(234,179,8,0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, fontWeight: '600' as const, color: '#ca8a04' },

  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    backgroundColor: 'rgba(99,102,241,0.08)',
    minHeight: 36,
  },
  btnText:         { fontSize: 12, fontWeight: '600' as const, color: '#6366f1' },
  btnDisabled:     { opacity: 0.4 },
  btnTextDisabled: { color: '#9ca3af' },

  scroll: { padding: 12, paddingBottom: 48 },
  center: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  empty:  { fontSize: 14, opacity: 0.5, textAlign: 'center' },

  item: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    backgroundColor: 'rgba(128,128,128,0.04)',
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemType:   { fontSize: 14, fontWeight: '600' as const },
  itemMeta:   { fontSize: 12, opacity: 0.7, marginTop: 2 },
  itemDate:   { fontSize: 11, opacity: 0.45, marginTop: 2 },
  itemError:  { fontSize: 11, color: '#b91c1c', marginTop: 4 },

  badge:     { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '600' as const },
});
