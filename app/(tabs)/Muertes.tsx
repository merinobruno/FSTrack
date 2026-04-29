import { Picker } from '@react-native-picker/picker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Platform,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import SendConfirmationModal from '@/components/SendConfirmationModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useCompany } from '@/contexts/CompanyContext';
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

function Input({ label, value, onChangeText, numeric = false }: any) {
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
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={numeric ? 'numeric' : 'default'}
          placeholderTextColor={isDark ? '#aaa' : '#666'}
        />
      </View>
    </>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  loading,
}: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <>
      <ThemedText>{label}</ThemedText>
      <View
        style={[
          styles.pickerContainer,
          {
            backgroundColor: isDark ? '#1f1f1f' : '#ebebeb',
            borderColor: isDark ? '#555' : '#999',
          },
        ]}
      >
        {loading ? (
          <View style={styles.pickerLoadingContainer}>
            <ActivityIndicator />
          </View>
        ) : (
          <Picker
            selectedValue={value}
            onValueChange={(v) => onChange(String(v))}
            style={[
              styles.picker,
              {
                color: isDark ? '#fff' : '#111',
                backgroundColor: 'transparent',
              },
            ]}
            dropdownIconColor={isDark ? '#fff' : '#111'}
            mode="dropdown"
          >
            <Picker.Item
              label="Seleccionar..."
              value=""
              color={isDark ? '#fff' : '#111'}
            />
            {options.map((o: SelectOption) => (
              <Picker.Item
                key={o.value}
                label={o.label}
                value={o.value}
                color={isDark ? '#fff' : '#111'}
              />
            ))}
          </Picker>
        )}
      </View>
    </>
  );
}

/* ================= MAIN ================= */

export default function TabTwoScreen() {
  const { selectedCompany } = useCompany();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  const client_id = 'a95197901b600187ba9e7712e547482e';
  const client_secret = 'a38d9c762c5108bbb5800c4b7b49a2f1';

  const getToken = async () => {
    const res = await fetch(
      `https://api.teamplace.finneg.com/api/oauth/token?grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`
    );

    if (!res.ok) {
      throw new Error(`Token request failed: ${res.status}`);
    }

    return await res.text();
  };

  /* ================= LOAD SELECTORS ================= */

  const loadLotes = async () => {
    setLoadingLote(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `https://api.finneg.com/api/Lote/list?ACCESS_TOKEN=${token}`
      );

      if (!res.ok) {
        throw new Error(`Lote request failed: ${res.status}`);
      }

      const data = await res.json();

      setLoteOptions(
        (Array.isArray(data) ? data : []).map((l: any) => ({
          label: l.nombre,
          value: l.codigo,
        }))
      );
    } catch (e: any) {
      setError(e.message || 'Error cargando lotes');
    } finally {
      setLoadingLote(false);
    }
  };

  const loadCategorias = async () => {
    setLoadingCategoria(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `https://api.finneg.com/api/haciendaCategoria/list?ACCESS_TOKEN=${token}`
      );

      if (!res.ok) {
        throw new Error(`Categoria request failed: ${res.status}`);
      }

      const data = await res.json();

      setCategoriaOptions(
        (Array.isArray(data) ? data : []).map((c: any) => ({
          label: c.nombre || c.descripcion,
          value: c.codigo,
        }))
      );
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
      prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it))
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
      setError('Seleccioná una empresa en Home antes de enviar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      const payload = buildPayload();

      console.log('Payload:', JSON.stringify(payload, null, 2));

      const res = await fetch(
        `https://api.finneg.com/api/MuerteHacienda?ACCESS_TOKEN=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text();

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      if (!res.ok) {
        throw new Error(
          `API request failed: ${res.status} - ${JSON.stringify(parsed)}`
        );
      }

      setApiResponse(parsed);
    } catch (e: any) {
      setError(e.message || 'Error enviando');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPress = () => {
  if (!selectedCompany) {
    setError('Seleccioná una empresa en Home antes de enviar.');
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

            <Select
              label="LoteOrigen"
              value={item.LoteOrigen}
              options={loteOptions}
              onChange={(v: string) => updateItem(i, 'LoteOrigen', v)}
              loading={loadingLote}
            />

            <Select
              label="CodigoCategoriahacienda"
              value={item.CodigoCategoriahacienda}
              options={categoriaOptions}
              onChange={(v: string) =>
                updateItem(i, 'CodigoCategoriahacienda', v)
              }
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
              label="KgTotales"
              value={item.KgTotales}
              onChangeText={(v: string) => updateItem(i, 'KgTotales', v)}
              numeric
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

            <Select
              label="EventoHaciendaClasificacionID"
              value={item.EventoHaciendaClasificacionID}
              options={CLASIFICACION_OPTIONS}
              onChange={(v: string) =>
                updateItem(i, 'EventoHaciendaClasificacionID', v)
              }
              loading={false}
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

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

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

pickerContainer: {
  borderWidth: 0,
  borderRadius: 10,
  minHeight: 56,
  justifyContent: 'center',
  paddingHorizontal: 4,
},

pickerLoadingContainer: {
  minHeight: 56,
  justifyContent: 'center',
  alignItems: 'center',
},

picker: {
  width: '100%',
  minHeight: 56,
  backgroundColor: 'transparent',
  borderWidth: 0,
  ...Platform.select({
    android: {
      height: 56,
    },
    ios: {
      height: 180,
    },
  }),
},

pickerItem: {
  fontSize: 14,
},

  itemButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },

  errorText: { color: 'red' },

  responseText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      web: 'monospace',
    }),
  },
});