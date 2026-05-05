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
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { ApiError, getFriendlyError, NETWORK_ERROR, TOKEN_ERROR } from '@/utils/api-error';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import { sendLog } from '@/utils/send-log';
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
  Hijos: string;
  Cab: string;
  KgCab: string;
  Kg: string;
  Tropa: string;
  CantidadMuertes: string;
  EventoHaciendaClasificacionID: string;
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
  Hijos: '',
  Cab: '',
  KgCab: '',
  Kg: '',
  Tropa: '',
  CantidadMuertes: '',
  EventoHaciendaClasificacionID: '',
  OrganizacionID: '',
  IDMadre: '',
});

/* ================= STATIC OPTIONS ================= */

const CLASIFICACION_OPTIONS: SelectOption[] = [
  { label: 'ACCIDENTE', value: 'ACCIDENTE' },
  { label: 'ACIDOSIS', value: 'ACIDOSIS-82' },
  { label: 'AL NACER', value: 'AL NACER-3' },
  { label: 'AL PARIR', value: 'AL PARIR-79' },
  { label: 'DESCONOCIDA', value: 'DESCONOCIDA-78' },
  { label: 'DIARREA NEONATAL', value: 'DIARREA NEONATAL-11' },
  { label: 'EMPASTE', value: 'EMPASTE-81' },
  {
    label: 'FOCO INFECCIOSO (USAR DECRIPCIÓN)',
    value: 'FOCO INFECCIOSO (USAR DECRIPCIÓN)-83',
  },
  { label: 'NEMONIA', value: 'NEMONIA-77' },
  { label: 'TIMPANISMO', value: 'TIMPANISMO-80' },
];

/* ================= COMPONENTS ================= */

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
};

function InputField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
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
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={isDark ? '#aaa' : '#666'}
        />
      </View>
    </>
  );
}

type SelectFieldProps = {
  label: string;
  selectedValue: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
};

function SelectField({
  label,
  selectedValue,
  options,
  onValueChange,
  placeholder = 'Seleccionar...',
  loading = false,
}: SelectFieldProps) {
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
            selectedValue={selectedValue}
            onValueChange={(value) => onValueChange(String(value))}
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
              label={placeholder}
              value=""
              color={isDark ? '#fff' : '#111'}
            />
            {options.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
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
  const { user } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
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
    setLoadingLotes(true);
    try {
      const token = await getToken();

      const response = await fetch(
        `https://api.finneg.com/api/Lote/list?ACCESS_TOKEN=${token}`
      );

      if (!response.ok) {
        throw new Error(`Lote request failed: ${response.status}`);
      }

      const data = await response.json();

      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: item.nombre ?? item.Nombre ?? item.codigo ?? item.Codigo ?? '',
          value: item.codigo ?? item.Codigo ?? '',
        }))
        .filter((item: SelectOption) => item.label && item.value);

      setLoteOptions(options);
    } catch (err: any) {
      setError(err.message || 'Error cargando LoteDestino');
    } finally {
      setLoadingLotes(false);
    }
  };

  const loadCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const token = await getToken();

      const response = await fetch(
        `https://api.finneg.com/api/haciendaCategoria/list?ACCESS_TOKEN=${token}`
      );

      if (!response.ok) {
        throw new Error(`Categoria request failed: ${response.status}`);
      }

      const data = await response.json();

      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label:
            item.nombre ??
            item.Nombre ??
            item.descripcion ??
            item.Descripcion ??
            item.codigo ??
            item.Codigo ??
            '',
          value:
            item.codigo ??
            item.Codigo ??
            item.value ??
            '',
        }))
        .filter((item: SelectOption) => item.label && item.value);

      setCategoriaOptions(options);
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
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
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
        'Hijo/s': item.Hijos || null,
        Cab: toNumberOrNull(item.Cab),
        'Kg/cab': toNumberOrNull(item.KgCab),
        Kg: toNumberOrNull(item.Kg),
        Tropa: item.Tropa || null,
        CantidadMuertes: toNumberOrNull(item.CantidadMuertes),
        EventoHaciendaClasificacionID: item.EventoHaciendaClasificacionID || null,
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
    setApiResponse(null);

    try {
      let tokenData: string;
      try {
        tokenData = await getToken();
      } catch {
        setError(TOKEN_ERROR);
        return;
      }

      const payload = buildPayload();
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const apiCall = await fetch(
        `https://api.finneg.com/api/NacimientosHacienda?ACCESS_TOKEN=${tokenData}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await apiCall.text();
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = responseText;
      }

      if (!apiCall.ok) {
        const friendlyError = getFriendlyError(apiCall.status, parsedResponse);
        setError(friendlyError);
        if (user?.token) sendLog(user.token, {
          form_type: 'NACIMIENTOS',
          lote: items[0]?.LoteDestino || null,
          categoria: items[0]?.CodigoCategoriahacienda || null,
          cantidad: parseInt(items[0]?.Cab) || null,
          status: 'ERROR',
          error_detail: friendlyError.title,
        });
        return;
      }

      setApiResponse(parsedResponse);
      if (user?.token) sendLog(user.token, {
        form_type: 'NACIMIENTOS',
        lote: items[0]?.LoteDestino || null,
        categoria: items[0]?.CodigoCategoriahacienda || null,
        cantidad: parseInt(items[0]?.Cab) || null,
        status: 'SUCCESS',
      });
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
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

            <SelectField
              label="LoteDestino"
              selectedValue={item.LoteDestino}
              options={loteOptions}
              onValueChange={(value) =>
                updateItemField(index, 'LoteDestino', value)
              }
              placeholder="Seleccionar lote..."
              loading={loadingLotes}
            />

            <SelectField
              label="CodigoCategoríahacienda"
              selectedValue={item.CodigoCategoriahacienda}
              options={categoriaOptions}
              onValueChange={(value) =>
                updateItemField(index, 'CodigoCategoriahacienda', value)
              }
              placeholder="Seleccionar categoría..."
              loading={loadingCategorias}
            />

            <SelectField
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

            <SelectField
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
              label="Kg"
              value={item.Kg}
              onChangeText={(text) =>
                updateItemField(index, 'Kg', text)
              }
              keyboardType="numeric"
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

            <SelectField
              label="EventoHaciendaClasificacionID"
              selectedValue={item.EventoHaciendaClasificacionID}
              options={CLASIFICACION_OPTIONS}
              onValueChange={(value) =>
                updateItemField(index, 'EventoHaciendaClasificacionID', value)
              }
              placeholder="Seleccionar clasificación..."
              loading={false}
            />

            <SelectField
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
  loader: {
    marginTop: 8,
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
  responseBox: {
    marginTop: 8,
    gap: 8,
  },
  responseText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      web: 'monospace',
    }),
  },
});