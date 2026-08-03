import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Field,
  FormScreen,
  FormSection,
  ItemCard,
  SecondaryButton,
  StatusBox,
} from '@/components/brand';
import { SearchableSelect } from '@/components/searchable-select';
import SendConfirmationModal from '@/components/SendConfirmationModal';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { ApiError } from '@/utils/api-error';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import { getCached, setCached } from '@/utils/options-cache';

/* ================= HELPERS ================= */

type SelectOption = {
  label: string;
  value: string;
};

const isEmptyValue = (value: any) =>
  value === null || value === undefined || value === '';

const cleanObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj
      .map(cleanObject)
      .filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          !(typeof item === 'object' &&
            !Array.isArray(item) &&
            Object.keys(item).length === 0)
      );
  }

  if (obj !== null && typeof obj === 'object') {
    const cleanedEntries = Object.entries(obj)
      .filter(([, value]) => !isEmptyValue(value))
      .map(([key, value]) => [key, cleanObject(value)]);

    return Object.fromEntries(
      cleanedEntries.filter(
        ([, value]) =>
          value !== null &&
          value !== undefined &&
          !(typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.keys(value).length === 0)
      )
    );
  }

  return obj;
};

const toNumberOrNull = (value: string) => {
  if (!value?.trim()) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
};

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`;
};

/* ================= STATIC OPTIONS ================= */

const CLASIFICACION_OPTIONS: SelectOption[] = [
  { label: 'ACCIDENTE', value: 'ACCIDENTE' },
  { label: 'ACIDOSIS', value: 'ACIDOSIS-82' },
  { label: 'AL NACER', value: 'AL NACER-3' },
  { label: 'AL PARIR', value: 'AL PARIR-79' },
  { label: 'DESCONOCIDA', value: 'DESCONOCIDA-78' },
  { label: 'DIARREA NEONATAL', value: 'DIARREA NEONATAL-11' },
  { label: 'EMPASTE', value: 'EMPASTE-81' },
  { label: 'FOCO INFECCIOSO (USAR DECRIPCIÓN)', value: 'FOCO INFECCIOSO (USAR DECRIPCIÓN)-83' },
  { label: 'NEMONIA', value: 'NEMONIA-77' },
  { label: 'TIMPANISMO', value: 'TIMPANISMO-80' },
];

/* ================= TYPES ================= */

type Item = {
  EventoHaciendaID: string;
  LoteOrigen: string;
  CodigoCategoriahacienda: string;
  Cab: string;
  KgCab: string;
  KgTotales: string;
  Caravanas: string;
  Tropa: string;
  EventoHaciendaClasificacionID: string;
  OrganizacionID: string;
};

const createEmptyItem = (): Item => ({
  EventoHaciendaID: 'MUE',
  LoteOrigen: '',
  CodigoCategoriahacienda: '',
  Cab: '',
  KgCab: '',
  KgTotales: '',
  Caravanas: '',
  Tropa: '',
  EventoHaciendaClasificacionID: '',
  OrganizacionID: '',
});

/* ================= MAIN ================= */

export default function TabTwoScreen() {
  const { selectedCompany } = useCompany();
  const { user } = useAuth();
  const { addAndSubmit } = useSubmissions();
  const { workflow } = useWorkflow();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  /* SELECT DATA */
  const [loteOptions, setLoteOptions] = useState<SelectOption[]>([]);
  const [categoriaOptions, setCategoriaOptions] = useState<SelectOption[]>([]);

  const [loadingLote, setLoadingLote] = useState(false);
  const [loadingCategoria, setLoadingCategoria] = useState(false);

  /* HEADER FORM */
  const [identificacionExterna, setIdentificacionExterna] = useState('');
  const [fecha, setFecha] = useState(getTodayDate());
  const [descripcion, setDescripcion] = useState('');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [chlModVenta, setChlModVenta] = useState('1');
  const [chlViaTransporte, setChlViaTransporte] = useState('');
  const [chlCantBultos, setChlCantBultos] = useState('0');
  const [chlTipoIndicadorTraslado, setChlTipoIndicadorTraslado] = useState('1');

  const [items, setItems] = useState<Item[]>([createEmptyItem()]);

  const getToken = async () => {
    if (!user?.token) throw new Error('No autenticado.');
    return getFinnegansToken(user.token);
  };

  /* ================= LOAD SELECTORS ================= */

  const loadLotes = async () => {
    const cacheKey = `lotes_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setLoteOptions(cached); return; }
    setLoadingLote(true);
    try {
      const token = await getToken();
      const res = await fetch(`https://api.finneg.com/api/Lote/list?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`Lote request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : []).map((l: any) => ({
        label: l.nombre ?? l.Nombre ?? l.codigo ?? '',
        value: l.codigo ?? '',
      })).filter((o: SelectOption) => o.label && o.value);
      setLoteOptions(options);
      await setCached(cacheKey, options);
    } catch (e: any) {
      setError(e.message || 'Error cargando lotes');
    } finally {
      setLoadingLote(false);
    }
  };

  const loadCategorias = async () => {
    const cacheKey = `categorias_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setCategoriaOptions(cached); return; }
    setLoadingCategoria(true);
    try {
      const token = await getToken();
      const res = await fetch(`https://api.finneg.com/api/haciendaCategoria/list?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`Categoria request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : []).map((c: any) => ({
        label: c.nombre ?? c.Nombre ?? c.descripcion ?? c.codigo ?? '',
        value: c.codigo ?? '',
      })).filter((o: SelectOption) => o.label && o.value);
      setCategoriaOptions(options);
      await setCached(cacheKey, options);
    } catch (e: any) {
      setError(e.message || 'Error cargando categorías');
    } finally {
      setLoadingCategoria(false);
    }
  };

  useEffect(() => {
    loadLotes();
    loadCategorias();
  }, []);

  /* ================= ITEMS ================= */

  const updateItem = (i: number, field: keyof Item, val: string) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== i) return it;
        const updated = { ...it, [field]: val };
        if (field === 'KgCab' || field === 'Cab') {
          const kgcab = parseFloat(updated.KgCab) || 0;
          const cab = parseFloat(updated.Cab) || 0;
          updated.KgTotales = kgcab > 0 && cab > 0 ? (kgcab * cab).toString() : '';
        }
        return updated;
      })
    );
  };

  const addItem = () =>
    setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  /* ================= SEND ================= */

  const buildPayload = () => {
    return cleanObject({
      IdentificacionExterna: identificacionExterna || null,
      Fecha: fecha,
      TransaccionTipo: 'OPER',
      TransaccionSubtipoCodigo: workflow.hacienda?.muertes?.codigo || 'HAC-MUE',
      Descripcion: descripcion,
      NumeroComprobante: numeroComprobante || null,
      EmpresaCodigo: selectedCompany?.value || null,
      Items: items.map((i) => ({
        EventoHaciendaID: i.EventoHaciendaID,
        LoteOrigen: i.LoteOrigen,
        CodigoCategoriahacienda: i.CodigoCategoriahacienda,
        Cab: toNumberOrNull(i.Cab),
        'Kg/cab': toNumberOrNull(i.KgCab),
        KgTotales: toNumberOrNull(i.KgTotales),
        Caravanas: i.Caravanas || null,
        Tropa: i.Tropa || null,
        EventoHaciendaClasificacionID: i.EventoHaciendaClasificacionID || null,
        OrganizacionID: i.OrganizacionID || null,
      })),
      CHL_ModVenta: chlModVenta || null,
      CHL_ViaTransporte: chlViaTransporte || null,
      CHL_CantBultos: toNumberOrNull(chlCantBultos),
      CHL_TipoIndicadorTraslado: chlTipoIndicadorTraslado || null,
    });
  };

  const submitMuertes = async () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná una empresa en Home antes de enviar.' });
      return;
    }
    setLoading(true);
    setError(null);

    const result = await addAndSubmit({
      formType: 'MUERTES',
      payload: buildPayload(),
      companyLabel: selectedCompany.label,
      lote: items[0]?.LoteOrigen || null,
      categoria: items[0]?.CodigoCategoriahacienda || null,
      cantidad: parseInt(items[0]?.Cab) || null,
    });

    setLoading(false);
    if (result.status === 'error') setError({ title: result.title, detail: result.detail });
    else router.back();
  };

  const handleSendPress = () => {
  if (!selectedCompany) {
    setError({ title: 'Seleccioná una empresa en Home antes de enviar.' });
    return;
  }

  setConfirmVisible(true);
};

  /* ================= UI ================= */

  return (
    <FormScreen
      title="MUERTES"
      subtitle="Alta de bajas"
      company={selectedCompany?.label}
    >
      <FormSection title="Datos principales">
        <Field label="Fecha" value={fecha} onChangeText={setFecha} />
        <Field label="Descripción" value={descripcion} onChangeText={setDescripcion} />
      </FormSection>

      <FormSection title="Ítems">
        {items.map((item, i) => (
          <ItemCard
            key={i}
            index={i}
            total={items.length}
            onRemove={items.length > 1 ? () => removeItem(i) : undefined}
          >
            <SearchableSelect
              label="Lote de origen"
              selectedValue={item.LoteOrigen}
              options={loteOptions}
              onValueChange={(v) => updateItem(i, 'LoteOrigen', v)}
              loading={loadingLote}
            />

            <SearchableSelect
              label="Categoría de hacienda"
              selectedValue={item.CodigoCategoriahacienda}
              options={categoriaOptions}
              onValueChange={(v) => updateItem(i, 'CodigoCategoriahacienda', v)}
              loading={loadingCategoria}
            />

            <SearchableSelect
              label="Clasificación"
              selectedValue={item.EventoHaciendaClasificacionID}
              options={CLASIFICACION_OPTIONS}
              onValueChange={(v) => updateItem(i, 'EventoHaciendaClasificacionID', v)}
            />

            <Field
              label="Cabezas"
              value={item.Cab}
              onChangeText={(v: string) => updateItem(i, 'Cab', v)}
              numeric
              optional
            />

            <Field
              label="Kg por cabeza"
              value={item.KgCab}
              onChangeText={(v: string) => updateItem(i, 'KgCab', v)}
              numeric
              optional
            />

            <Field
              label="Kg totales"
              value={item.KgTotales}
              onChangeText={() => {}}
              numeric
              editable={false}
              hint="Se calcula como cabezas × kg por cabeza."
            />

            <Field
              label="Caravanas"
              value={item.Caravanas}
              onChangeText={(v: string) => updateItem(i, 'Caravanas', v)}
              optional
            />

            <Field
              label="Tropa"
              value={item.Tropa}
              onChangeText={(v: string) => updateItem(i, 'Tropa', v)}
              optional
            />
          </ItemCard>
        ))}

        <SecondaryButton title="Agregar ítem" onPress={addItem} />
      </FormSection>

      <View style={styles.footer}>
        <Button
          title="Enviar"
          variant="accent"
          onPress={handleSendPress}
          loading={loading}
        />

        {error && (
          <StatusBox variant="error" title={error.title} detail={error.detail} />
        )}
      </View>

      <SendConfirmationModal
        visible={confirmVisible}
        title="¿Estás seguro?"
        payload={buildPayload()}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={async () => {
          setConfirmVisible(false);
          await submitMuertes();
        }}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </FormScreen>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  footer: { gap: Spacing.md },
});