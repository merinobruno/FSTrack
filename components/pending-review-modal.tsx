import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SearchableSelect, SelectOption } from '@/components/searchable-select';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';
import { Submission } from '@/utils/local-db';
import { getCached } from '@/utils/options-cache';

const FORM_LABELS: Record<string, string> = {
  PRODUCCION:  'Producción',
  NACIMIENTOS: 'Nacimientos',
  MUERTES:     'Muertes',
  TRASLADOS:   'Traslados',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  return (
    <View style={s.row}>
      <ThemedText style={s.rowLabel}>{label}</ThemedText>
      <ThemedText style={[s.rowValue, { color: isDark ? '#d1d5db' : '#374151' }]}>
        {value || '—'}
      </ThemedText>
    </View>
  );
}

type Props = { visible: boolean; onClose: () => void };

export default function PendingReviewModal({ visible, onClose }: Props) {
  const { user } = useAuth();
  const { companies } = useCompany();
  const { submissions, syncOne } = useSubmissions();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const pending = submissions.filter((s) => s.status === 'PENDING');

  const [loteOptions,     setLoteOptions]     = useState<SelectOption[]>([]);
  const [categoriaOptions, setCategoriaOptions] = useState<SelectOption[]>([]);
  const [depositoOptions,  setDepositoOptions]  = useState<SelectOption[]>([]);

  // edited payload per submission id
  const [editedPayloads, setEditedPayloads] = useState<Record<number, any>>({});
  // expanded state per card
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  // per-id sending flag
  const [sendingIds, setSendingIds] = useState<Set<number>>(new Set());
  const [sendingAll,  setSendingAll]  = useState(false);

  useEffect(() => {
    if (!visible) return;
    loadOptions();
    initPayloads();
  }, [visible]);

  const loadOptions = async () => {
    const id = user?.domainId;
    const [lotes, cats, deps] = await Promise.all([
      getCached<SelectOption[]>(`lotes_${id}`),
      getCached<SelectOption[]>(`categorias_${id}`),
      getCached<SelectOption[]>(`depositos_${id}`),
    ]);
    if (lotes) setLoteOptions(lotes);
    if (cats)  setCategoriaOptions(cats);
    if (deps)  setDepositoOptions(deps);
  };

  const initPayloads = () => {
    const payloads: Record<number, any>  = {};
    const exp:      Record<number, boolean> = {};
    submissions
      .filter((s) => s.status === 'PENDING')
      .forEach((sub) => {
        try { payloads[sub.id] = JSON.parse(sub.payload); } catch {}
        exp[sub.id] = true;
      });
    setEditedPayloads(payloads);
    setExpanded(exp);
  };

  /* ── field updaters ── */

  const updateField = (subId: number, field: string, value: any) =>
    setEditedPayloads((prev) => ({ ...prev, [subId]: { ...prev[subId], [field]: value } }));

  const updateItemField = (subId: number, idx: number, field: string, value: any) =>
    setEditedPayloads((prev) => {
      const items = [...(prev[subId]?.Items ?? [])];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, [subId]: { ...prev[subId], Items: items } };
    });

  const updateMovField = (subId: number, idx: number, field: string, value: any) =>
    setEditedPayloads((prev) => {
      const movs = [...(prev[subId]?.MovimientoHaciendaProduccionLeche ?? [])];
      movs[idx] = { ...movs[idx], [field]: value };
      return { ...prev, [subId]: { ...prev[subId], MovimientoHaciendaProduccionLeche: movs } };
    });

  /* ── send ── */

  const sendOne = async (sub: Submission) => {
    setSendingIds((prev) => new Set([...prev, sub.id]));
    await syncOne(sub.id, editedPayloads[sub.id]);
    setSendingIds((prev) => { const n = new Set(prev); n.delete(sub.id); return n; });
  };

  const sendAll = async () => {
    setSendingAll(true);
    for (const sub of pending) {
      await syncOne(sub.id, editedPayloads[sub.id]);
    }
    setSendingAll(false);
    onClose();
  };

  /* ── form-type renderers ── */

  const renderFields = (sub: Submission) => {
    const p = editedPayloads[sub.id];
    if (!p) return null;

    switch (sub.form_type) {
      case 'PRODUCCION': {
        const movs: any[] = p.MovimientoHaciendaProduccionLeche ?? [];
        return (
          <>
            <ReadRow label="Fecha"   value={p.Fecha ?? ''} />
            <ReadRow label="Cabezas" value={String(p.Cabezas ?? '')} />
            <SearchableSelect
              label="HaciendaCategoriaCodigo"
              selectedValue={p.HaciendaCategoriaCodigo ?? ''}
              options={categoriaOptions}
              onValueChange={(v) => updateField(sub.id, 'HaciendaCategoriaCodigo', v)}
              placeholder="Seleccionar categoría..."
            />
            <SearchableSelect
              label="LoteCodigo"
              selectedValue={p.LoteCodigo ?? ''}
              options={loteOptions}
              onValueChange={(v) => updateField(sub.id, 'LoteCodigo', v)}
              placeholder="Seleccionar lote..."
            />
            {movs.map((mov, i) => (
              <View key={i} style={[s.subItem, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ThemedText style={[s.subLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Movimiento {i + 1}
                </ThemedText>
                <ReadRow label="Litros (Dosis)" value={String(mov.Dosis ?? '')} />
                <SearchableSelect
                  label="Depósito (LoteCodigo)"
                  selectedValue={mov.LoteCodigo ?? ''}
                  options={depositoOptions}
                  onValueChange={(v) => updateMovField(sub.id, i, 'LoteCodigo', v)}
                  placeholder="Seleccionar depósito..."
                />
              </View>
            ))}
          </>
        );
      }

      case 'NACIMIENTOS': {
        const items: any[] = p.Items ?? [];
        return (
          <>
            <ReadRow label="Fecha" value={p.Fecha ?? ''} />
            {items.map((item, i) => (
              <View key={i} style={[s.subItem, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ThemedText style={[s.subLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Item {i + 1}
                </ThemedText>
                <ReadRow label="Cab" value={String(item.Cab ?? '')} />
                <SearchableSelect
                  label="LoteDestino"
                  selectedValue={item.LoteDestino ?? ''}
                  options={loteOptions}
                  onValueChange={(v) => updateItemField(sub.id, i, 'LoteDestino', v)}
                  placeholder="Seleccionar lote..."
                />
                <SearchableSelect
                  label="CodigoCategoríahacienda"
                  selectedValue={item['CodigoCategoríahacienda'] ?? item.CodigoCategoriahacienda ?? ''}
                  options={categoriaOptions}
                  onValueChange={(v) => updateItemField(sub.id, i, 'CodigoCategoríahacienda', v)}
                  placeholder="Seleccionar categoría..."
                />
              </View>
            ))}
          </>
        );
      }

      case 'MUERTES': {
        const items: any[] = p.Items ?? [];
        return (
          <>
            <ReadRow label="Fecha" value={p.Fecha ?? ''} />
            {items.map((item, i) => (
              <View key={i} style={[s.subItem, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ThemedText style={[s.subLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Item {i + 1}
                </ThemedText>
                <ReadRow label="Cab" value={String(item.Cab ?? '')} />
                <SearchableSelect
                  label="LoteOrigen"
                  selectedValue={item.LoteOrigen ?? ''}
                  options={loteOptions}
                  onValueChange={(v) => updateItemField(sub.id, i, 'LoteOrigen', v)}
                  placeholder="Seleccionar lote..."
                />
                <SearchableSelect
                  label="CodigoCategoriahacienda"
                  selectedValue={item.CodigoCategoriahacienda ?? ''}
                  options={categoriaOptions}
                  onValueChange={(v) => updateItemField(sub.id, i, 'CodigoCategoriahacienda', v)}
                  placeholder="Seleccionar categoría..."
                />
              </View>
            ))}
          </>
        );
      }

      case 'TRASLADOS': {
        const items: any[] = p.Items ?? [];
        return (
          <>
            <ReadRow label="Fecha" value={p.Fecha ?? ''} />
            {items.map((item, i) => (
              <View key={i} style={[s.subItem, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <ThemedText style={[s.subLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Item {i + 1}
                </ThemedText>
                <ReadRow label="Cab" value={String(item.Cab ?? '')} />
                <SearchableSelect
                  label="LoteOrigen"
                  selectedValue={item.LoteOrigen ?? ''}
                  options={loteOptions}
                  onValueChange={(v) => updateItemField(sub.id, i, 'LoteOrigen', v)}
                  placeholder="Seleccionar lote..."
                />
                <SearchableSelect
                  label="CategoriaOrigen"
                  selectedValue={item.CategoriaOrigen ?? ''}
                  options={categoriaOptions}
                  onValueChange={(v) => updateItemField(sub.id, i, 'CategoriaOrigen', v)}
                  placeholder="Seleccionar categoría..."
                />
                <SearchableSelect
                  label="EstablecimientoDestino"
                  selectedValue={item.EstablecimientoDestino ?? ''}
                  options={companies}
                  onValueChange={(v) => updateItemField(sub.id, i, 'EstablecimientoDestino', v)}
                  placeholder="Seleccionar establecimiento..."
                />
                <SearchableSelect
                  label="LoteDestino"
                  selectedValue={item.LoteDestino ?? ''}
                  options={loteOptions}
                  onValueChange={(v) => updateItemField(sub.id, i, 'LoteDestino', v)}
                  placeholder="Seleccionar lote..."
                />
                <SearchableSelect
                  label="CategoriaDestino"
                  selectedValue={item.CategoriaDestino ?? ''}
                  options={categoriaOptions}
                  onValueChange={(v) => updateItemField(sub.id, i, 'CategoriaDestino', v)}
                  placeholder="Seleccionar categoría..."
                />
              </View>
            ))}
          </>
        );
      }

      default:
        return <ReadRow label="Payload" value={sub.payload.slice(0, 120) + '...'} />;
    }
  };

  /* ── theme ── */

  const bg       = isDark ? '#111827' : '#f9fafb';
  const headerBg = isDark ? '#1f2937' : '#ffffff';
  const cardBg   = isDark ? '#1f2937' : '#ffffff';
  const border   = isDark ? '#374151' : '#e5e7eb';
  const subtle   = isDark ? '#9ca3af' : '#6b7280';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.container, { backgroundColor: bg }]}>

        {/* Header */}
        <View style={[s.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
          <ThemedText style={s.title}>
            Revisar pendientes ({pending.length})
          </ThemedText>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={22} color={subtle} />
          </Pressable>
        </View>

        {pending.length === 0 ? (
          <View style={s.emptyContainer}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color={subtle} />
            <ThemedText style={[s.emptyText, { color: subtle }]}>
              No hay formularios pendientes.
            </ThemedText>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={s.scroll}>
              {pending.map((sub) => {
                const isExpanded = expanded[sub.id] ?? true;
                const isSending  = sendingIds.has(sub.id);

                return (
                  <View key={sub.id} style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>

                    {/* Card header row */}
                    <Pressable
                      style={s.cardHeader}
                      onPress={() =>
                        setExpanded((prev) => ({ ...prev, [sub.id]: !isExpanded }))
                      }
                    >
                      <View style={s.cardHeaderLeft}>
                        <ThemedText style={s.cardType}>
                          {FORM_LABELS[sub.form_type] ?? sub.form_type}
                        </ThemedText>
                        {sub.company_label && (
                          <ThemedText style={[s.cardMeta, { color: subtle }]}>
                            {sub.company_label}
                          </ThemedText>
                        )}
                        <ThemedText style={[s.cardDate, { color: subtle }]}>
                          {formatDate(sub.created_at)}
                        </ThemedText>
                      </View>
                      <View style={s.cardHeaderRight}>
                        <Pressable
                          style={[s.sendBtn, (isSending || sendingAll) && s.sendBtnDisabled]}
                          onPress={() => sendOne(sub)}
                          disabled={isSending || sendingAll}
                          hitSlop={8}
                        >
                          {isSending
                            ? <ActivityIndicator size="small" color="#6366f1" />
                            : <ThemedText style={s.sendBtnText}>Enviar</ThemedText>
                          }
                        </Pressable>
                        <MaterialCommunityIcons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={subtle}
                        />
                      </View>
                    </Pressable>

                    {/* Card body */}
                    {isExpanded && (
                      <View style={[s.cardBody, { borderTopColor: border }]}>
                        {renderFields(sub)}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Send all */}
            <View style={[s.footer, { backgroundColor: headerBg, borderTopColor: border }]}>
              <Pressable
                style={[s.sendAllBtn, (sendingAll || sendingIds.size > 0) && s.sendBtnDisabled]}
                onPress={sendAll}
                disabled={sendingAll || sendingIds.size > 0}
              >
                {sendingAll
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <ThemedText style={s.sendAllText}>
                      Enviar todos ({pending.length})
                    </ThemedText>
                }
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' as const },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15 },

  scroll: { padding: 12, gap: 12, paddingBottom: 24 },

  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardHeaderLeft:  { flex: 1, gap: 2 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardType: { fontSize: 15, fontWeight: '600' as const },
  cardMeta: { fontSize: 12 },
  cardDate: { fontSize: 11 },

  sendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    backgroundColor: 'rgba(99,102,241,0.08)',
    minWidth: 64,
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { fontSize: 13, fontWeight: '600' as const, color: '#6366f1' },

  cardBody: { padding: 14, borderTopWidth: 1, gap: 10 },

  subItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  subLabel: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  rowLabel: { fontSize: 13, opacity: 0.55 },
  rowValue: { fontSize: 13, fontWeight: '500' as const },

  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  sendAllBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    minHeight: 50,
  },
  sendAllText: { fontSize: 15, fontWeight: '700' as const, color: '#fff' },
});
