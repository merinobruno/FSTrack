import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import SendConfirmationModal from '@/components/SendConfirmationModal';
import { SearchableSelect, SelectOption } from '@/components/searchable-select';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { ApiError } from '@/utils/api-error';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import { getCached, setCached } from '@/utils/options-cache';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/* ================= HELPERS ================= */

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
          !(typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0)
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
          !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

// Eventos de Hacienda. El endpoint EventoHacienda/list NO expone la columna `Codigo`
// (solo EventoHaciendaID + Nombre), pero TrasladosHacienda valida el campo
// EventoHaciendaID contra `Codigo`, así que las opciones se definen acá:
// label = Nombre, value = Codigo.
const EVENTO_HACIENDA_OPTIONS: SelectOption[] = [
  { label: 'AJUSTE', value: 'AJUSTE' },
  { label: 'Chequeo', value: 'CHEQUEO' },
  { label: 'COMPRA', value: 'COMPRA' },
  { label: 'CONSUMO', value: 'CONS' },
  { label: 'DEPs', value: 'DEP' },
  { label: 'DESPACHO', value: 'DESP' },
  { label: 'EVENTO GENERAL - DESTETE', value: 'Evento General - Destete' },
  { label: 'EVENTO GENERAL - DETECCIÓN DE PREÑEZ', value: 'Evento General - Detección de Preñez' },
  { label: 'EVENTO GENERAL - DETECCIÓN DE PREÑEZ - VACIO', value: 'Evento General - Detección de Preñez - Vacio' },
  { label: 'EVENTO GENERAL - EXPOSICIÓN', value: 'Evento General - Exposicion' },
  { label: 'EVENTO GENERAL - SELECCIÓN DE REPRODUCTORES', value: 'Evento General - Selección de Reproductores' },
  { label: 'EVENTO GENERAL - SERVICIO', value: 'EVENTO GENERAL - SERVICIO' },
  { label: 'Fenotipo', value: 'FENOTIPO' },
  { label: 'Inseminacion', value: 'INS' },
  { label: 'Interrupción de Gestación', value: 'INTERRUPCION' },
  { label: 'MUERTE', value: 'MUE' },
  { label: 'NACIMIENTO', value: 'NAC' },
  { label: 'PARTO', value: 'PARTO' },
  { label: 'PESAJE', value: 'PESAJE' },
  { label: 'PRODUCCIÓN DE LANA', value: 'PRODLANA' },
  { label: 'PRODUCCIÓN DE LECHE', value: 'PRODLECHE' },
  { label: 'RECEPCIÓN', value: 'RECEP' },
  { label: 'RECUENTO', value: 'RECUENTO' },
  { label: 'SANIDAD', value: 'SANIDAD' },
  { label: 'SECADO', value: 'SECADO' },
  { label: 'SUPLEMENTACIÓN', value: 'SUPLEMENTACION' },
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'TRASLADO/CAMBIO CATEGORÍA', value: 'CAMBCAT' },
  { label: 'VENTA', value: 'VENTA' },
];

/* ================= TYPES ================= */

type Item = {
  EventoHaciendaID: string;
  LoteOrigen: string;
  CategoriaOrigen: string;
  EstablecimientoDestino: string;
  LoteDestino: string;
  CategoriaDestino: string;
  KgCab: string;
  Cab: string;
  Clasificacion: string;
  Tropa: string;
};

const createEmptyItem = (): Item => ({
  EventoHaciendaID: '',
  LoteOrigen: '',
  CategoriaOrigen: '',
  EstablecimientoDestino: '',
  LoteDestino: '',
  CategoriaDestino: '',
  KgCab: '',
  Cab: '',
  Clasificacion: '',
  Tropa: '',
});

/* ================= COMPONENTS ================= */

function Input({ label, value, onChangeText, numeric = false, editable = true }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  return (
    <>
      <ThemedText>{label}</ThemedText>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? '#1f1f1f' : '#ebebeb',
            opacity: editable ? 1 : 0.55,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: isDark ? '#fff' : '#111' }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={numeric ? 'numeric' : 'default'}
          placeholderTextColor={isDark ? '#aaa' : '#666'}
          editable={editable}
        />
      </View>
    </>
  );
}

/* ================= MAIN ================= */

export default function TrasladosScreen() {
  const { selectedCompany, companies } = useCompany();
  const { user } = useAuth();
  const { addAndSubmit } = useSubmissions();
  const { workflow } = useWorkflow();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [loteOptions, setLoteOptions] = useState<SelectOption[]>([]);
  const [categoriaOptions, setCategoriaOptions] = useState<SelectOption[]>([]);
  const [eventoOptions, setEventoOptions] = useState<SelectOption[]>(EVENTO_HACIENDA_OPTIONS);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingEventos, setLoadingEventos] = useState(false);

  const [fecha, setFecha] = useState(getTodayDate());
  const [descripcion, setDescripcion] = useState('');
  const [numeroComprobante, setNumeroComprobante] = useState('');

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
    setLoadingLotes(true);
    try {
      const token = await getToken();
      const res = await fetch(`https://api.finneg.com/api/Lote/list?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`Lote request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((l: any) => ({
          label: l.nombre ?? l.Nombre ?? l.codigo ?? '',
          value: l.codigo ?? '',
        }))
        .filter((o: SelectOption) => o.label && o.value);
      setLoteOptions(options);
      await setCached(cacheKey, options);
    } catch (e: any) {
      setError({ title: e.message || 'Error cargando lotes' });
    } finally {
      setLoadingLotes(false);
    }
  };

  const loadCategorias = async () => {
    const cacheKey = `categorias_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setCategoriaOptions(cached); return; }
    setLoadingCategorias(true);
    try {
      const token = await getToken();
      const res = await fetch(`https://api.finneg.com/api/haciendaCategoria/list?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`Categoria request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((c: any) => ({
          label: c.nombre ?? c.Nombre ?? c.descripcion ?? c.codigo ?? '',
          value: c.codigo ?? '',
        }))
        .filter((o: SelectOption) => o.label && o.value);
      setCategoriaOptions(options);
      await setCached(cacheKey, options);
    } catch (e: any) {
      setError({ title: e.message || 'Error cargando categorías' });
    } finally {
      setLoadingCategorias(false);
    }
  };

  const loadEventos = async () => {
    const cacheKey = `eventos_hac_cod_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached?.length) { setEventoOptions(cached); return; }
    setLoadingEventos(true);
    try {
      const token = await getToken();
      const res = await fetch(`https://api.finneg.com/api/EventoHacienda/list?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`EventoHacienda request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((e: any) => ({
          label: e.Nombre ?? e.nombre ?? '',
          value: e.codigo ?? e.Codigo ?? '',
        }))
        .filter((o: SelectOption) => o.label && o.value)
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
      // Si la API todavía no expone `codigo`, las opciones quedan vacías y
      // se mantiene la lista estática (EVENTO_HACIENDA_OPTIONS) como respaldo.
      if (options.length > 0) {
        setEventoOptions(options);
        await setCached(cacheKey, options);
      }
    } catch (e: any) {
      console.error('Error cargando eventos de hacienda:', e);
    } finally {
      setLoadingEventos(false);
    }
  };

  useEffect(() => {
    loadLotes();
    loadCategorias();
    loadEventos();
  }, []);

  /* ================= ITEMS ================= */

  const updateItem = (i: number, field: keyof Item, val: string) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  /* ================= PAYLOAD ================= */

  const buildPayload = () => {
    return cleanObject({
      Fecha: fecha,
      TransaccionTipo: 'OPER',
      TransaccionSubtipoCodigo: workflow.hacienda?.traslados?.codigo || 'TRA-CAT',
      EmpresaCodigo: selectedCompany?.value || null,
      Descripcion: descripcion || null,
      NumeroComprobante: numeroComprobante || null,
      Items: items.map((item) => {
        const kgCab = toNumberOrNull(item.KgCab) ?? 0;
        const cab = toNumberOrNull(item.Cab) ?? 0;
        return {
          EventoHaciendaID: item.EventoHaciendaID || null,
          LoteOrigen: item.LoteOrigen || null,
          CategoriaOrigen: item.CategoriaOrigen || null,
          EstablecimientoDestino: item.EstablecimientoDestino || null,
          LoteDestino: item.LoteDestino || null,
          CategoriaDestino: item.CategoriaDestino || null,
          'Kg/Cab': kgCab || null,
          Cab: cab || null,
          Kg: kgCab && cab ? kgCab * cab : null,
          Clasificacion: item.Clasificacion || null,
          Tropa: item.Tropa || null,
        };
      }),
    });
  };

  /* ================= SEND ================= */

  const submitTraslados = async () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná una empresa en Home antes de enviar.' });
      return;
    }
    setLoading(true);
    setError(null);

    const result = await addAndSubmit({
      formType: 'TRASLADOS',
      payload: buildPayload(),
      companyLabel: selectedCompany.label,
      lote: items[0]?.LoteOrigen || null,
      categoria: items[0]?.CategoriaOrigen || null,
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
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <MaterialCommunityIcons
          name="swap-horizontal"
          size={200}
          color="white"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Traslados {selectedCompany ? `- ${selectedCompany.label}` : '- Sin empresa'}
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de Traslado y Cambio de Categoría.</ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Datos principales</ThemedText>

        <Input label="Fecha" value={fecha} onChangeText={setFecha} />
        <Input label="Descripcion" value={descripcion} onChangeText={setDescripcion} />
        <Input label="NumeroComprobante" value={numeroComprobante} onChangeText={setNumeroComprobante} />

        <ThemedText type="subtitle">Items</ThemedText>

        {items.map((item, i) => {
          const kgCab = toNumberOrNull(item.KgCab) ?? 0;
          const cab = toNumberOrNull(item.Cab) ?? 0;
          const kg = kgCab && cab ? (kgCab * cab).toFixed(2) : '';

          return (
            <ThemedView key={i} style={styles.miniForm}>
              <ThemedText style={styles.itemTitle}>Item {i + 1}</ThemedText>

              <SearchableSelect
                label="EventoHaciendaID"
                selectedValue={item.EventoHaciendaID}
                options={eventoOptions}
                onValueChange={(v) => updateItem(i, 'EventoHaciendaID', v)}
                placeholder="Seleccionar evento..."
                loading={loadingEventos}
              />

              <ThemedText style={styles.sectionLabel}>Origen</ThemedText>

              <SearchableSelect
                label="LoteOrigen"
                selectedValue={item.LoteOrigen}
                options={loteOptions}
                onValueChange={(v) => updateItem(i, 'LoteOrigen', v)}
                placeholder="Seleccionar lote..."
                loading={loadingLotes}
              />

              <SearchableSelect
                label="CategoriaOrigen"
                selectedValue={item.CategoriaOrigen}
                options={categoriaOptions}
                onValueChange={(v) => updateItem(i, 'CategoriaOrigen', v)}
                placeholder="Seleccionar categoría..."
                loading={loadingCategorias}
              />

              <ThemedText style={styles.sectionLabel}>Destino</ThemedText>

              <SearchableSelect
                label="EstablecimientoDestino"
                selectedValue={item.EstablecimientoDestino}
                options={companies}
                onValueChange={(v) => updateItem(i, 'EstablecimientoDestino', v)}
                placeholder="Seleccionar establecimiento..."
              />

              <SearchableSelect
                label="LoteDestino"
                selectedValue={item.LoteDestino}
                options={loteOptions}
                onValueChange={(v) => updateItem(i, 'LoteDestino', v)}
                placeholder="Seleccionar lote..."
                loading={loadingLotes}
              />

              <SearchableSelect
                label="CategoriaDestino"
                selectedValue={item.CategoriaDestino}
                options={categoriaOptions}
                onValueChange={(v) => updateItem(i, 'CategoriaDestino', v)}
                placeholder="Seleccionar categoría..."
                loading={loadingCategorias}
              />

              <ThemedText style={styles.sectionLabel}>Movimiento</ThemedText>

              <Input
                label="Kg/Cab"
                value={item.KgCab}
                onChangeText={(v: string) => updateItem(i, 'KgCab', v)}
                numeric
              />

              <Input
                label="Cab"
                value={item.Cab}
                onChangeText={(v: string) => updateItem(i, 'Cab', v)}
                numeric
              />

              <Input
                label="Kg (automático)"
                value={kg}
                onChangeText={() => {}}
                numeric
                editable={false}
              />

              <SearchableSelect
                label="Clasificacion"
                selectedValue={item.Clasificacion}
                options={CLASIFICACION_OPTIONS}
                onValueChange={(v) => updateItem(i, 'Clasificacion', v)}
                placeholder="Seleccionar clasificación..."
              />

              <Input
                label="Tropa"
                value={item.Tropa}
                onChangeText={(v: string) => updateItem(i, 'Tropa', v)}
              />

              <View style={styles.itemButtons}>
                <Button title="Agregar item" onPress={addItem} />
                {items.length > 1 && (
                  <Button title="Quitar item" onPress={() => removeItem(i)} color="#b00020" />
                )}
              </View>
            </ThemedView>
          );
        })}

        <Button
          title={loading ? 'Enviando...' : 'Enviar'}
          onPress={handleSendPress}
          disabled={loading}
        />

        {loading && <ActivityIndicator />}

        {error && (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorTitle}>{error.title}</ThemedText>
            {error.detail && (
              <ThemedText style={styles.errorDetail}>{error.detail}</ThemedText>
            )}
          </View>
        )}

        <SendConfirmationModal
          visible={confirmVisible}
          title="¿Estás seguro?"
          payload={buildPayload()}
          onCancel={() => setConfirmVisible(false)}
          onConfirm={async () => {
            setConfirmVisible(false);
            await submitTraslados();
          }}
          confirmText="Confirmar"
          cancelText="Cancelar"
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  headerImage: { position: 'absolute' },
  titleContainer: { flexDirection: 'row', gap: 8 },
  formContainer: {
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(83, 83, 83, 0.07)',
  },
  miniForm: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  sectionLabel: { fontSize: 12, opacity: 0.5, marginTop: 4, fontWeight: '600' as const },
  itemButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  inputContainer: {
    borderRadius: 10,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  input: {
    width: '100%',
    minHeight: 56,
    fontSize: 16,
    paddingVertical: 0,
  },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  successText: { color: '#059669', fontSize: 14, fontWeight: '600' as const },
  queueBox: {
    backgroundColor: 'rgba(234,179,8,0.08)',
    borderColor: 'rgba(234,179,8,0.35)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  queueText: { color: '#b45309', fontSize: 14 },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  errorTitle: { color: '#b91c1c', fontSize: 14, fontWeight: '600' as const },
  errorDetail: { color: '#b91c1c', fontSize: 13, opacity: 0.85 },
});
