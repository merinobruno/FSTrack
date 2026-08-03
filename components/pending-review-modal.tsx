import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, SecondaryButton } from '@/components/brand';
import { SearchableSelect, SelectOption } from '@/components/searchable-select';
import {
  Effects,
  FontFamily,
  Palette,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
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
  PEDIDO_COMPRA: 'Pedido Compra',
  PEDIDO_VENTA: 'Pedido Venta',
  NOVEDADES_SUELDO: 'Novedades de Sueldo',
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
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value || '—'}</Text>
    </View>
  );
}

type Props = { visible: boolean; onClose: () => void };

export default function PendingReviewModal({ visible, onClose }: Props) {
  const { user } = useAuth();
  const { companies } = useCompany();
  const { submissions, syncOne } = useSubmissions();

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
              <View key={i} style={s.subItem}>
                <Text style={s.subLabel}>Movimiento {i + 1}</Text>
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
              <View key={i} style={s.subItem}>
                <Text style={s.subLabel}>Ítem {i + 1}</Text>
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
              <View key={i} style={s.subItem}>
                <Text style={s.subLabel}>Ítem {i + 1}</Text>
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
              <View key={i} style={s.subItem}>
                <Text style={s.subLabel}>Ítem {i + 1}</Text>
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Revisar pendientes ({pending.length})</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={22} color={Palette.navy} />
          </Pressable>
        </View>

        {pending.length === 0 ? (
          <View style={s.emptyContainer}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={48}
              color={Palette.steel}
            />
            <Text style={s.emptyText}>No hay formularios pendientes.</Text>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={s.scroll}>
              {pending.map((sub) => {
                const isExpanded = expanded[sub.id] ?? true;
                const isSending = sendingIds.has(sub.id);

                return (
                  <View key={sub.id} style={s.card}>
                    <Pressable
                      style={s.cardHeader}
                      onPress={() =>
                        setExpanded((prev) => ({ ...prev, [sub.id]: !isExpanded }))
                      }
                    >
                      <View style={s.cardHeaderLeft}>
                        <Text style={s.cardType}>
                          {FORM_LABELS[sub.form_type] ?? sub.form_type}
                        </Text>
                        {sub.company_label && (
                          <Text style={s.cardMeta}>{sub.company_label}</Text>
                        )}
                        <Text style={s.cardDate}>{formatDate(sub.created_at)}</Text>
                      </View>

                      <View style={s.cardHeaderRight}>
                        <SecondaryButton
                          title="Enviar"
                          onPress={() => sendOne(sub)}
                          disabled={isSending || sendingAll}
                          loading={isSending}
                          style={s.sendBtn}
                        />
                        <MaterialCommunityIcons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={Palette.steelDeep}
                        />
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View style={s.cardBody}>{renderFields(sub)}</View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View style={s.footer}>
              <Button
                title={`Enviar todos (${pending.length})`}
                onPress={sendAll}
                disabled={sendingAll || sendingIds.size > 0}
                loading={sendingAll}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.surface },

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
  title: {
    ...Type.title,
    fontFamily: FontFamily.bold,
    color: Palette.navy,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    ...Type.body,
    color: Palette.steelText,
  },

  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },

  card: {
    backgroundColor: Palette.surfaceHigh,
    borderWidth: 1.5,
    borderColor: Effects.hairline,
    borderRadius: Radius.card,
    overflow: 'hidden',
    ...Effects.panelShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeaderLeft: { flex: 1, gap: 2 },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardType: {
    ...Type.body,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
  },
  cardMeta: {
    ...Type.caption,
    color: Palette.steelText,
  },
  cardDate: {
    ...Type.micro,
    color: Palette.steelText,
  },
  sendBtn: { minWidth: 92 },

  cardBody: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Effects.hairline,
    gap: Spacing.md,
  },

  subItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: Effects.edge,
    borderRadius: Radius.field,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  subLabel: {
    ...Type.micro,
    fontFamily: FontFamily.bold,
    color: Palette.steelText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.md,
    paddingVertical: 2,
  },
  rowLabel: {
    ...Type.label,
    color: Palette.steelText,
  },
  rowValue: {
    ...Type.label,
    fontFamily: FontFamily.semibold,
    color: Palette.ink,
    flexShrink: 1,
  },

  footer: {
    padding: Spacing.lg,
    backgroundColor: Palette.surfaceHigh,
    borderTopWidth: 1,
    borderTopColor: Effects.hairline,
  },
});
