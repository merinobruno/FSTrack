import { router } from 'expo-router';
import { SearchableSelect, SelectOption } from '@/components/searchable-select';
import SendConfirmationModal from '@/components/SendConfirmationModal';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ApiError } from '@/utils/api-error';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import { getCached, setCached } from '@/utils/options-cache';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const toNumberOrZero = (value: string) => {
  if (!value?.trim()) return 0;
  const parsed = Number(value.replace(',', '.'));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const nullableDate = (value: string) => value.trim() || null;

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type NovedadItem = {
  FechaDesde: string;
  TipoNovedadCodigo: string;
  Valor: string;
  CantidadHorasNormales: string;
  Fecha: string;
  Descripcion: string;
  PersonaCodigo: string;
  FechaHasta: string;
  Tipo: string;
};

const createEmptyItem = (fecha: string): NovedadItem => ({
  FechaDesde: '',
  TipoNovedadCodigo: '',
  Valor: '',
  CantidadHorasNormales: '0',
  Fecha: fecha,
  Descripcion: '',
  PersonaCodigo: '',
  FechaHasta: '',
  Tipo: '0',
});

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
};

function InputField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
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
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#aaa' : '#666'}
        />
      </View>
    </>
  );
}

export default function NovedadesScreen() {
  const { selectedCompany } = useCompany();
  const { user } = useAuth();
  const { addAndSubmit } = useSubmissions();

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [tipoOptions, setTipoOptions] = useState<SelectOption[]>([]);
  const [personaOptions, setPersonaOptions] = useState<SelectOption[]>([]);

  const [nombre] = useState('');
  const [fechaComprobante] = useState(getTodayDate());
  const [identificacionExterna] = useState('');
  const [fecha, setFecha] = useState(getTodayDate());
  const [descripcion, setDescripcion] = useState('');
  const [transaccionSubtipoCodigo] = useState('NOVEDADES');
  const [transaccionTipoCodigo] = useState('NOVEDADESLIQUIDACIONSUELDOS');
  const [usrPeriodo] = useState('');
  const [usrPersona] = useState('');
  const [items, setItems] = useState<NovedadItem[]>([createEmptyItem(getTodayDate())]);

  const getToken = async () => {
    if (!user?.token) throw new Error('No autenticado.');
    return getFinnegansToken(user.token);
  };

  const normalizeKey = (key: string) => key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const findFirstArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];

    for (const nested of Object.values(value)) {
      const rows = findFirstArray(nested);
      if (rows.length > 0) return rows;
    }

    return [];
  };

  const getFirstValue = (item: any, keys: string[]) => {
    for (const key of keys) {
      const value = item?.[key];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        return String(value);
      }
    }
    return '';
  };

  const getFirstDeepValue = (item: any, keys: string[]): string => {
    const targetKeys = new Set(keys.map(normalizeKey));
    const seen = new Set<any>();

    const visit = (value: any): string => {
      if (!value || typeof value !== 'object' || seen.has(value)) return '';
      seen.add(value);

      for (const [key, nested] of Object.entries(value)) {
        if (
          targetKeys.has(normalizeKey(key)) &&
          nested !== null &&
          nested !== undefined &&
          String(nested).trim() !== ''
        ) {
          return String(nested);
        }
      }

      for (const nested of Object.values(value)) {
        const found = visit(nested);
        if (found) return found;
      }

      return '';
    };

    return visit(item);
  };

  const mapOptions = (data: any): SelectOption[] => {
    const rows = Array.isArray(data)
      ? data
      : data?.data ??
        data?.Data ??
        data?.DATA ??
        data?.rows ??
        data?.Rows ??
        data?.ROWS ??
        data?.result ??
        data?.Result ??
        data?.RESULT ??
        data?.items ??
        data?.Items ??
        findFirstArray(data);

    return (Array.isArray(rows) ? rows : [])
      .map((item: any) => {
        const value = getFirstValue(item, [
          'codigo',
          'Codigo',
          'CODIGO',
          'personaCodigo',
          'PersonaCodigo',
          'PERSONACODIGO',
          'empleadoCodigo',
          'EmpleadoCodigo',
          'EMPLEADOCODIGO',
          'legajoCodigo',
          'LegajoCodigo',
          'LEGAJOCODIGO',
          'cuit',
          'Cuit',
          'CUIT',
          'email',
          'Email',
          'EMAIL',
          'mail',
          'Mail',
          'MAIL',
          'identificacion',
          'Identificacion',
          'IDENTIFICACION',
          'value',
        ]) || getFirstDeepValue(item, [
          'personaCodigo',
          'PersonaCodigo',
          'codigoPersona',
          'CodigoPersona',
          'empleadoCodigo',
          'EmpleadoCodigo',
          'legajoCodigo',
          'LegajoCodigo',
          'codigo',
          'Codigo',
          'cuit',
          'CUIT',
          'email',
          'Email',
        ]);

        const nombre = getFirstValue(item, ['nombre', 'Nombre', 'NOMBRE']) || getFirstDeepValue(item, ['nombre', 'Nombre']);
        const apellido = getFirstValue(item, ['apellido', 'Apellido', 'APELLIDO']) || getFirstDeepValue(item, ['apellido', 'Apellido']);
        const descripcion = getFirstValue(item, ['descripcion', 'Descripcion', 'DESCRIPCION']) || getFirstDeepValue(item, ['descripcion', 'Descripcion']);
        const razonSocial = getFirstValue(item, ['razonSocial', 'RazonSocial', 'RAZONSOCIAL']) || getFirstDeepValue(item, ['razonSocial', 'RazonSocial']);
        const label = [apellido, nombre].filter(Boolean).join(', ') || nombre || descripcion || razonSocial || value;

        return { label, value };
      })
      .filter((item: SelectOption) => item.label && item.value);
  };

  const loadOptions = async (
    cacheKey: string,
    endpoint: string,
    setOptions: (options: SelectOption[]) => void,
    setLoadingState: (loading: boolean) => void
  ) => {
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached && cached.length > 0) {
      setOptions(cached);
      return;
    }

    setLoadingState(true);
    try {
      const token = await getToken();
      const response = await fetch(`${endpoint}?ACCESS_TOKEN=${token}`);
      if (!response.ok) return;
      const options = mapOptions(await response.json());
      setOptions(options);
      if (options.length > 0) {
        await setCached(cacheKey, options);
      }
    } catch {
      // Lists are optional here; manual code inputs remain available.
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    if (!user?.token) return;
    const domainId = user?.domainId ?? 'default';
    loadOptions(
      `tipos_novedad_sueldo_${domainId}`,
      'https://api.finneg.com/api/TIPONOVEDADLIQUIDACIONSUELDOS/list',
      setTipoOptions,
      setLoadingTipos
    );
    loadOptions(
      `empleados_v3_codigo_${domainId}`,
      'https://api.finneg.com/api/Empleado/list',
      setPersonaOptions,
      setLoadingPersonas
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, user?.domainId]);

  const updateItemField = (index: number, field: keyof NovedadItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyItem(fecha)]);

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const buildPayload = () => {
    const rawPayload = {
      Nombre: nombre,
      FechaComprobante: fechaComprobante || null,
      IdentificacionExterna: identificacionExterna,
      EmpresaCodigo: selectedCompany?.value || null,
      Fecha: fecha || null,
      Descripcion: descripcion,
      TransaccionSubtipoCodigo: transaccionSubtipoCodigo || 'NOVEDADES',
      TransaccionTipoCodigo: transaccionTipoCodigo || 'NOVEDADESLIQUIDACIONSUELDOS',
      NovedadesLiquidacionSueldosLegajo: items.map((item) => ({
        FechaDesde: nullableDate(item.FechaDesde),
        TipoNovedadCodigo: item.TipoNovedadCodigo || null,
        Valor: toNumberOrZero(item.Valor),
        CantidadHorasNormales: toNumberOrZero(item.CantidadHorasNormales),
        Fecha: item.Fecha || fecha || null,
        Descripcion: item.Descripcion,
        PersonaCodigo: item.PersonaCodigo || null,
        FechaHasta: nullableDate(item.FechaHasta),
        Tipo: toNumberOrZero(item.Tipo),
      })),
      USR_PERIODO: usrPeriodo || null,
      USR_PERSONA: usrPersona || null,
    };

    return rawPayload;
  };

  const submitNovedades = async () => {
    if (!selectedCompany) {
      setError({ title: 'Selecciona una empresa en Home antes de enviar.' });
      return;
    }

    setLoading(true);
    setError(null);

    const firstItem = items[0];
    const result = await addAndSubmit({
      formType: 'NOVEDADES_SUELDO',
      payload: buildPayload(),
      companyLabel: selectedCompany.label,
      categoria: firstItem?.TipoNovedadCodigo || null,
      cantidad: toNumberOrZero(firstItem?.Valor ?? ''),
      deposito: firstItem?.PersonaCodigo || null,
    });

    setLoading(false);
    if (result.status === 'error') setError({ title: result.detail });
    else router.back();
  };

  const handleSendPress = () => {
    if (!selectedCompany) {
      setError({ title: 'Selecciona una empresa en Home antes de enviar.' });
      return;
    }

    setConfirmVisible(true);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <MaterialCommunityIcons
          name="account-cash-outline"
          size={200}
          color="white"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Novedades {selectedCompany ? `- ${selectedCompany.label}` : '- Sin empresa'}
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de novedades para liquidacion de sueldos.</ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Datos principales</ThemedText>

        {selectedCompany && (
          <View style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              EmpresaCodigo: {selectedCompany.value}
            </ThemedText>
          </View>
        )}

        <InputField label="Fecha" value={fecha} onChangeText={setFecha} />
        <InputField label="Descripcion" value={descripcion} onChangeText={setDescripcion} />

        <ThemedText type="subtitle">NovedadesLiquidacionSueldosLegajo</ThemedText>

        {items.map((item, index) => (
          <ThemedView key={index} style={styles.miniForm}>
            <ThemedText style={styles.itemTitle}>Item {index + 1}</ThemedText>

            {tipoOptions.length > 0 ? (
              <SearchableSelect
                label="TipoNovedadCodigo"
                selectedValue={item.TipoNovedadCodigo}
                options={tipoOptions}
                onValueChange={(value) => updateItemField(index, 'TipoNovedadCodigo', value)}
                placeholder="Seleccionar tipo de novedad..."
                loading={loadingTipos}
              />
            ) : (
              <InputField
                label="TipoNovedadCodigo"
                value={item.TipoNovedadCodigo}
                onChangeText={(text) => updateItemField(index, 'TipoNovedadCodigo', text)}
                placeholder="Ej: FINN_LCT_7030"
              />
            )}

            <SearchableSelect
              label="PersonaCodigo"
              selectedValue={item.PersonaCodigo}
              options={personaOptions}
              onValueChange={(value) => updateItemField(index, 'PersonaCodigo', value)}
              placeholder="Seleccionar empleado..."
              loading={loadingPersonas}
            />
            {!loadingPersonas && personaOptions.length === 0 && (
              <ThemedText style={styles.helpText}>
                No se encontraron empleados para mostrar.
              </ThemedText>
            )}

            <InputField
              label="Valor"
              value={item.Valor}
              onChangeText={(text) => updateItemField(index, 'Valor', text)}
              keyboardType="numeric"
            />
            <InputField label="Fecha" value={item.Fecha} onChangeText={(text) => updateItemField(index, 'Fecha', text)} />
            <InputField label="Descripcion" value={item.Descripcion} onChangeText={(text) => updateItemField(index, 'Descripcion', text)} />

            <View style={styles.itemButtons}>
              <Button title="Agregar item" onPress={addItem} />
              {items.length > 1 && (
                <Button title="Quitar item" onPress={() => removeItem(index)} color="#b00020" />
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
            {error.detail && <ThemedText style={styles.errorDetail}>{error.detail}</ThemedText>}
          </View>
        )}
        <SendConfirmationModal
          visible={confirmVisible}
          title="Estas seguro?"
          payload={buildPayload()}
          onCancel={() => setConfirmVisible(false)}
          onConfirm={async () => {
            setConfirmVisible(false);
            await submitNovedades();
          }}
          confirmText="Confirmar"
          cancelText="Cancelar"
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { position: 'absolute' },
  titleContainer: { flexDirection: 'row', gap: 8 },
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
  infoBox: {
    backgroundColor: 'rgba(14,165,233,0.08)',
    borderColor: 'rgba(14,165,233,0.28)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  infoText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  helpText: {
    color: '#b45309',
    fontSize: 12,
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
