import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import SendConfirmationModal from '@/components/SendConfirmationModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';
import { ApiError } from '@/utils/api-error';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import { getCached, setCached } from '@/utils/options-cache';
import { SearchableSelect } from '@/components/searchable-select';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
            borderColor: isDark ? '#555' : '#999',
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: isDark ? '#fff' : '#111',
              backgroundColor: 'transparent',
              opacity: editable ? 1 : 0.6,
            },
          ]}
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

export default function TabTwoScreen() {
  const { selectedCompany } = useCompany();
  const { user } = useAuth();
  const { addAndSubmit } = useSubmissions();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<'sent' | 'queued' | null>(null);
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
      TransaccionSubtipoCodigo: 'HAC-MUE',
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
    setSubmitted(null);

    const result = await addAndSubmit({
      formType: 'MUERTES',
      payload: buildPayload(),
      companyLabel: selectedCompany.label,
      lote: items[0]?.LoteOrigen || null,
      categoria: items[0]?.CodigoCategoriahacienda || null,
      cantidad: parseInt(items[0]?.Cab) || null,
    });

    setLoading(false);
    if (result.status === 'error') setError({ title: result.detail });
    else setSubmitted(result.status);
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
          name="cow-off"
          size={200}
          color="white"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Muertes {selectedCompany ? `- ${selectedCompany.label}` : '- Sin empresa'}
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de Alta de Muertes.</ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Datos principales</ThemedText>

        <Input
          label="Fecha"
          value={fecha}
          onChangeText={setFecha}
        />

        <Input
          label="Descripcion"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <ThemedText type="subtitle">Items</ThemedText>

        {items.map((item, i) => (
          <ThemedView key={i} style={styles.miniForm}>
            <ThemedText style={styles.itemTitle}>
              Item {i + 1}
            </ThemedText>

            <SearchableSelect
              label="LoteOrigen"
              selectedValue={item.LoteOrigen}
              options={loteOptions}
              onValueChange={(v) => updateItem(i, 'LoteOrigen', v)}
              loading={loadingLote}
            />

            <SearchableSelect
              label="CodigoCategoriahacienda"
              selectedValue={item.CodigoCategoriahacienda}
              options={categoriaOptions}
              onValueChange={(v) => updateItem(i, 'CodigoCategoriahacienda', v)}
              loading={loadingCategoria}
            />

            <Input
              label="Cab"
              value={item.Cab}
              onChangeText={(v: string) => updateItem(i, 'Cab', v)}
              numeric
            />

            <Input
              label="Kg/cab"
              value={item.KgCab}
              onChangeText={(v: string) => updateItem(i, 'KgCab', v)}
              numeric
            />

            <Input
              label="KgTotales (automático)"
              value={item.KgTotales}
              onChangeText={() => {}}
              numeric
              editable={false}
            />

            <Input
              label="Caravanas"
              value={item.Caravanas}
              onChangeText={(v: string) => updateItem(i, 'Caravanas', v)}
            />

            <Input
              label="Tropa"
              value={item.Tropa}
              onChangeText={(v: string) => updateItem(i, 'Tropa', v)}
            />

            <SearchableSelect
              label="EventoHaciendaClasificacionID"
              selectedValue={item.EventoHaciendaClasificacionID}
              options={CLASIFICACION_OPTIONS}
              onValueChange={(v) => updateItem(i, 'EventoHaciendaClasificacionID', v)}
            />

            <View style={styles.itemButtons}>
              <Button title="Agregar item" onPress={addItem} />
              {items.length > 1 && (
                <Button
                  title="Quitar item"
                  onPress={() => removeItem(i)}
                  color="#b00020"
                />
              )}
            </View>
          </ThemedView>
        ))}

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
        {submitted === 'sent' && (
          <View style={styles.successBox}>
            <ThemedText style={styles.successText}>Enviado correctamente.</ThemedText>
          </View>
        )}
        {submitted === 'queued' && (
          <View style={styles.queueBox}>
            <ThemedText style={styles.queueText}>Sin conexión. Guardado para enviar cuando se restaure la red.</ThemedText>
          </View>
        )}

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

  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  inputContainer: {
  borderWidth: 0,
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


  itemButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },

  successBox: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  queueBox: {
    backgroundColor: 'rgba(234,179,8,0.08)',
    borderColor: 'rgba(234,179,8,0.35)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  queueText: {
    color: '#b45309',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  errorDetail: {
    color: '#b91c1c',
    fontSize: 13,
    opacity: 0.85,
  },

});