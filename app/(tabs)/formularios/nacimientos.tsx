import { router } from 'expo-router';
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

/* ================= TYPES ================= */

type SelectOption = {
  label: string;
  value: string;
};

type NacimientoItem = {
  EventoHaciendaID: string;
  LoteDestino: string;
  CodigoCategoriahacienda: string;
  Madre: string;
  CantidadMadres: string;
  CantidadKgsCabezaMadre: string;
  CCMadre: string;
  Hijos: string;
  Cab: string;
  KgCab: string;
  Kg: string;
  Tropa: string;
  CantidadMuertes: string;
  EventoHaciendaClasificacionID: string;
  ClasifMuerte: string;
  OrganizacionID: string;
  IDMadre: string;
};

const createEmptyItem = (): NacimientoItem => ({
  EventoHaciendaID: 'NAC',
  LoteDestino: '',
  CodigoCategoriahacienda: '',
  Madre: '',
  CantidadMadres: '',
  CantidadKgsCabezaMadre: '',
  CCMadre: '',
  Hijos: '',
  Cab: '',
  KgCab: '',
  Kg: '',
  Tropa: '',
  CantidadMuertes: '',
  EventoHaciendaClasificacionID: '',
  ClasifMuerte: '',
  OrganizacionID: '',
  IDMadre: '',
});

/* ================= STATIC OPTIONS ================= */

const BIRTH_CLASIFICACION_OPTIONS: SelectOption[] = [
  { label: 'NATURAL', value: 'NATURAL-5' },
  { label: 'ASISTIDO', value: 'ASISTIDO' },
  { label: 'CESÁREA', value: 'CESAREA' },
];

const MUERTE_CLASIFICACION_OPTIONS: SelectOption[] = [
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

/* ================= COMPONENTS ================= */

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  editable?: boolean;
};

function InputField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  editable = true,
}: InputFieldProps) {
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
          keyboardType={keyboardType}
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
  const [error, setError] = useState<ApiError | null>(null);

  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  const [loteOptions, setLoteOptions] = useState<SelectOption[]>([]);
  const [categoriaOptions, setCategoriaOptions] = useState<SelectOption[]>([]);

  // Header form
  const [identificacionExterna, setIdentificacionExterna] = useState('');
  const [fecha, setFecha] = useState(getTodayDate());
  const [transaccionTipo, setTransaccionTipo] = useState('OPER');
  const [transaccionSubtipoCodigo, setTransaccionSubtipoCodigo] = useState('NAC');
  const [descripcion, setDescripcion] = useState('');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [nombre, setNombre] = useState('');

  // Items
  const [items, setItems] = useState<NacimientoItem[]>([createEmptyItem()]);

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
      const response = await fetch(`https://api.finneg.com/api/Lote/list?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`Lote request failed: ${response.status}`);
      const data = await response.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: item.nombre ?? item.Nombre ?? item.codigo ?? item.Codigo ?? '',
          value: item.codigo ?? item.Codigo ?? '',
        }))
        .filter((item: SelectOption) => item.label && item.value);
      setLoteOptions(options);
      await setCached(cacheKey, options);
    } catch (err: any) {
      setError(err.message || 'Error cargando LoteDestino');
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
      const response = await fetch(`https://api.finneg.com/api/haciendaCategoria/list?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`Categoria request failed: ${response.status}`);
      const data = await response.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: item.nombre ?? item.Nombre ?? item.descripcion ?? item.Descripcion ?? item.codigo ?? item.Codigo ?? '',
          value: item.codigo ?? item.Codigo ?? item.value ?? '',
        }))
        .filter((item: SelectOption) => item.label && item.value);
      setCategoriaOptions(options);
      await setCached(cacheKey, options);
    } catch (err: any) {
      setError(err.message || 'Error cargando categorías');
    } finally {
      setLoadingCategorias(false);
    }
  };

  useEffect(() => {
    loadLotes();
    loadCategorias();
  }, []);

  /* ================= ITEMS ================= */

  const updateItemField = (
    index: number,
    field: keyof NacimientoItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'KgCab' || field === 'Cab') {
          const kgcab = parseFloat(updated.KgCab) || 0;
          const cab = parseFloat(updated.Cab) || 0;
          updated.Kg = kgcab > 0 && cab > 0 ? (kgcab * cab).toString() : '';
        }
        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  /* ================= PAYLOAD ================= */

  const buildPayload = () => {
    const rawPayload = {
      IdentificacionExterna: identificacionExterna || null,
      Fecha: fecha || null,
      TransaccionTipo: transaccionTipo || 'OPER',
      TransaccionSubtipoCodigo: transaccionSubtipoCodigo || 'NAC',
      Descripcion: descripcion || null,
      NumeroComprobante: numeroComprobante || null,
      EmpresaCodigo: selectedCompany?.value || null,
      Nombre: nombre || null,
      Items: items.map((item) => ({
        EventoHaciendaID: item.EventoHaciendaID || 'NAC',
        LoteDestino: item.LoteDestino || null,
        'CodigoCategoríahacienda': item.CodigoCategoriahacienda || null,
        Madre: item.Madre || null,
        CantidadMadres: toNumberOrNull(item.CantidadMadres),
        CantidadKgsCabezaMadre: toNumberOrNull(item.CantidadKgsCabezaMadre),
        CCMadre: item.CCMadre || null,
        'Hijo/s': item.Hijos || null,
        Cab: toNumberOrNull(item.Cab),
        'Kg/cab': toNumberOrNull(item.KgCab),
        Kg: toNumberOrNull(item.Kg),
        Tropa: item.Tropa || null,
        CantidadMuertes: toNumberOrNull(item.CantidadMuertes),
        EventoHaciendaClasificacionID: item.EventoHaciendaClasificacionID || null,
        ClasifMuerte: item.ClasifMuerte || null,
        OrganizacionID: item.OrganizacionID || null,
        IDTernero: [],
        IDMadre: item.IDMadre || null,
      })),
    };

    return cleanObject(rawPayload);
  };

  /* ================= SEND ================= */


  const submitNacimiento = async () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná una empresa en Home antes de enviar.' });
      return;
    }
    setLoading(true);
    setError(null);

    const result = await addAndSubmit({
      formType: 'NACIMIENTOS',
      payload: buildPayload(),
      companyLabel: selectedCompany.label,
      lote: items[0]?.LoteDestino || null,
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
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <MaterialCommunityIcons
          name="cow"
          size={200}
          color="white"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          Nacimientos {selectedCompany ? `- ${selectedCompany.label}` : '- Sin empresa'}
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de Alta de Nacimientos.</ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Datos principales</ThemedText>

        <InputField
          label="Fecha"
          value={fecha}
          onChangeText={setFecha}
        />

        <InputField
          label="Descripcion"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <ThemedText type="subtitle">Items</ThemedText>

        {items.map((item, index) => (
          <ThemedView key={index} style={styles.miniForm}>
            <ThemedText style={styles.itemTitle}>
              Item {index + 1}
            </ThemedText>

            <SearchableSelect
              label="LoteDestino"
              selectedValue={item.LoteDestino}
              options={loteOptions}
              onValueChange={(value) =>
                updateItemField(index, 'LoteDestino', value)
              }
              placeholder="Seleccionar lote..."
              loading={loadingLotes}
            />

            <SearchableSelect
              label="CodigoCategoríahacienda"
              selectedValue={item.CodigoCategoriahacienda}
              options={categoriaOptions}
              onValueChange={(value) =>
                updateItemField(index, 'CodigoCategoriahacienda', value)
              }
              placeholder="Seleccionar categoría..."
              loading={loadingCategorias}
            />

            <SearchableSelect
              label="Madre"
              selectedValue={item.Madre}
              options={categoriaOptions}
              onValueChange={(value) =>
                updateItemField(index, 'Madre', value)
              }
              placeholder="Seleccionar madre..."
              loading={loadingCategorias}
            />

            <InputField
              label="CantidadMadres"
              value={item.CantidadMadres}
              onChangeText={(text) =>
                updateItemField(index, 'CantidadMadres', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="CantidadKgsCabezaMadre"
              value={item.CantidadKgsCabezaMadre}
              onChangeText={(text) =>
                updateItemField(index, 'CantidadKgsCabezaMadre', text)
              }
              keyboardType="numeric"
            />

            <SearchableSelect
              label="CC Madre"
              selectedValue={item.CCMadre}
              options={categoriaOptions}
              onValueChange={(value) => updateItemField(index, 'CCMadre', value)}
              placeholder="Seleccionar CC Madre..."
              loading={loadingCategorias}
            />

            <SearchableSelect
              label="Hijo/s"
              selectedValue={item.Hijos}
              options={categoriaOptions}
              onValueChange={(value) =>
                updateItemField(index, 'Hijos', value)
              }
              placeholder="Seleccionar hijo..."
              loading={loadingCategorias}
            />

            <InputField
              label="Cab"
              value={item.Cab}
              onChangeText={(text) =>
                updateItemField(index, 'Cab', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="Kg/cab"
              value={item.KgCab}
              onChangeText={(text) =>
                updateItemField(index, 'KgCab', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="Kg (automático)"
              value={item.Kg}
              onChangeText={() => {}}
              keyboardType="numeric"
              editable={false}
            />

            <InputField
              label="Tropa"
              value={item.Tropa}
              onChangeText={(text) =>
                updateItemField(index, 'Tropa', text)
              }
            />

            <InputField
              label="CantidadMuertes"
              value={item.CantidadMuertes}
              onChangeText={(text) =>
                updateItemField(index, 'CantidadMuertes', text)
              }
              keyboardType="numeric"
            />

            <SearchableSelect
              label="Clasificación"
              selectedValue={item.EventoHaciendaClasificacionID}
              options={BIRTH_CLASIFICACION_OPTIONS}
              onValueChange={(value) =>
                updateItemField(index, 'EventoHaciendaClasificacionID', value)
              }
              placeholder="Seleccionar clasificación..."
              loading={false}
            />

            <SearchableSelect
              label="Clasif. Muerte"
              selectedValue={item.ClasifMuerte}
              options={MUERTE_CLASIFICACION_OPTIONS}
              onValueChange={(value) => updateItemField(index, 'ClasifMuerte', value)}
              placeholder="Seleccionar clasif. muerte..."
              loading={false}
            />

            <SearchableSelect
              label="IDMadre"
              selectedValue={item.IDMadre}
              options={categoriaOptions}
              onValueChange={(value) =>
                updateItemField(index, 'IDMadre', value)
              }
              placeholder="Seleccionar IDMadre..."
              loading={loadingCategorias}
            />

            <View style={styles.itemButtons}>
              <Button title="Agregar item" onPress={addItem} />
              {items.length > 1 && (
                <Button
                  title="Quitar item"
                  onPress={() => removeItem(index)}
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

        {loading && <ActivityIndicator style={styles.loader} />}

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
            await submitNacimiento();
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
  headerImage: {
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  formContainer: {
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
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
  itemButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
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

  loader: {
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