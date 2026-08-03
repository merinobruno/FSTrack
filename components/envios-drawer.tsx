import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Chip, SecondaryButton, StatusBadge } from '@/components/brand';
import PendingReviewModal from '@/components/pending-review-modal';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.88, 420);

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
  const nl = item.error_detail?.indexOf('\n') ?? -1;
  const errorTitle =
    item.error_detail && nl >= 0 ? item.error_detail.slice(0, nl) : item.error_detail;
  const errorDetail =
    item.error_detail && nl >= 0 ? item.error_detail.slice(nl + 1) : null;

  return (
    <View style={s.item}>
      <View style={s.itemHeader}>
        <Text style={s.itemType}>
          {FORM_LABELS[item.form_type] ?? item.form_type}
        </Text>
        <StatusBadge
          variant={item.status === 'SUCCESS' ? 'success' : 'error'}
          label={item.status === 'SUCCESS' ? 'Enviado' : 'Error'}
        />
      </View>

      {item.company_label && <Text style={s.itemMeta}>{item.company_label}</Text>}
      {item.lote && <Text style={s.itemMeta}>Lote: {item.lote}</Text>}
      <Text style={s.itemDate}>{formatDate(item.created_at)}</Text>

      {item.status === 'ERROR' && errorTitle && (
        <View style={s.errorBlock}>
          <Text style={s.itemError}>{errorTitle}</Text>
          {errorDetail && <Text style={s.itemErrorDetail}>{errorDetail}</Text>}
        </View>
      )}
    </View>
  );
}

type Props = { visible: boolean; onClose: () => void };

export default function EnviosDrawer({ visible, onClose }: Props) {
  const { user } = useAuth();
  const { submissions } = useSubmissions();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
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
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 72,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setModalOpen(false));
    }
  }, [visible]);

  return (
    <>
      <Modal
        visible={modalOpen}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={s.overlay}>
          <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          <Animated.View
            style={[
              s.drawer,
              { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] },
            ]}
          >
            <View style={s.header}>
              <View style={s.titleRow}>
                <Text style={s.title}>Envíos</Text>
                {pending > 0 && (
                  <Chip
                    label={`${pending} pendiente${pending !== 1 ? 's' : ''}`}
                  />
                )}
              </View>
              <Pressable onPress={onClose} hitSlop={12}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={Palette.navy}
                />
              </Pressable>
            </View>

            <View style={s.actions}>
              <SecondaryButton
                title="Revisar y sincronizar"
                onPress={() => setReviewOpen(true)}
                disabled={pending === 0}
                style={s.action}
              />
              <SecondaryButton
                title="Actualizar"
                onPress={fetchLogs}
                loading={loading}
                style={s.action}
              />
            </View>

            <ScrollView
              contentContainerStyle={s.scroll}
              showsVerticalScrollIndicator={false}
            >
              {loading && logs.length === 0 ? (
                <View style={s.center}>
                  <ActivityIndicator size="large" color={Palette.navy} />
                </View>
              ) : logs.length === 0 ? (
                <View style={s.center}>
                  <MaterialCommunityIcons
                    name="clipboard-list-outline"
                    size={40}
                    color={Palette.steel}
                  />
                  <Text style={s.empty}>No hay envíos registrados aún.</Text>
                </View>
              ) : (
                <View style={s.list}>
                  {logs.map((item) => (
                    <LogItem key={String(item.id)} item={item} />
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <PendingReviewModal
        visible={reviewOpen}
        onClose={() => {
          setReviewOpen(false);
          fetchLogs();
        }}
      />
    </>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 47, 67, 0.48)',
  },

  drawer: {
    flex: 1,
    backgroundColor: Palette.surface,
    shadowColor: Palette.navy,
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.surfaceHigh,
    borderBottomWidth: 1,
    borderBottomColor: Effects.hairline,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  title: {
    ...Type.title,
    fontFamily: FontFamily.bold,
    color: Palette.navy,
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Effects.hairline,
  },
  action: { flex: 1 },

  scroll: { padding: Spacing.md, paddingBottom: 48 },
  list: { gap: Spacing.sm },
  center: { alignItems: 'center', paddingVertical: 48, gap: Spacing.md },
  empty: {
    ...Type.label,
    color: Palette.steelText,
    textAlign: 'center',
  },

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
  itemType: {
    ...Type.label,
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

  errorBlock: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Semantic.errorEdge,
    gap: 2,
  },
  itemError: {
    ...Type.caption,
    fontFamily: FontFamily.semibold,
    color: Semantic.error,
  },
  itemErrorDetail: {
    ...Type.micro,
    color: Semantic.error,
    opacity: 0.85,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
});
