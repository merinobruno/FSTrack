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
import { useWorkflow } from '@/contexts/WorkflowContext';
import { ApiError } from '@/utils/api-error';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import { getCached, setCached } from '@/utils/options-cache';
import { SearchableSelect } from '@/components/searchable-select';
import AntDesign from '@expo/vector-icons/AntDesign';

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
  if (value === null || value === undefined || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type SelectOption = {
  label: string;
  value: string;
};

type MovimientoItem = {
  ProductoCodigo: string;
  LoteCodigo: string;
  Dosis: string;
  Grasa: string;
  UFC: string;
  Acidez: string;
  Proteinas: string;
  Temperatura: string;
  CelSomaticas: string;
  PartidaCodigo: string;
  OrganizacionStockCodigo: string;
};

const createEmptyMovimientoItem = (): MovimientoItem => ({
  ProductoCodigo: 'LECHE',
  LoteCodigo: '',
  Dosis: '',
  Grasa: '',
  UFC: '',
  Acidez: '',
  Proteinas: '',
  Temperatura: '',
  CelSomaticas: '',
  PartidaCodigo: '',
  OrganizacionStockCodigo: '',
});

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


export default function TabTwoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { addAndSubmit } = useSubmissions();
  const { workflow } = useWorkflow();
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loadingHaciendaCategorias, setLoadingHaciendaCategorias] = useState(false);
  const [loadingDepositos, setLoadingDepositos] = useState(false);
  const [loadingProductosLeche, setLoadingProductosLeche] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const [loteOptions, setLoteOptions] = useState<SelectOption[]>([]);
  const [haciendaCategoriaOptions, setHaciendaCategoriaOptions] = useState<SelectOption[]>([]);
  const [depositoOptions, setDepositoOptions] = useState<SelectOption[]>([]);
  const [productoLecheOptions, setProductoLecheOptions] = useState<SelectOption[]>([]);

  // Main fields
  const [identificacionExterna, setIdentificacionExterna] = useState('');
  const [transaccionSubtipoCodigo, setTransaccionSubtipoCodigo] = useState('PRODLECH');
  const [fecha, setFecha] = useState(getTodayDate());
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [campanaCodigo, setCampanaCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [haciendaCategoriaCodigo, setHaciendaCategoriaCodigo] = useState('');
  const [loteCodigo, setLoteCodigo] = useState('LECH-36');
  const [cabezas, setCabezas] = useState('');
  const [tropa, setTropa] = useState('');
  const { selectedCompany } = useCompany();
  // Dynamic movement items
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>([
    createEmptyMovimientoItem(),
  ]);

  const getToken = async () => {
    if (!user?.token) throw new Error('No autenticado.');
    return getFinnegansToken(user.token);
  };

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
      console.error('Error loading lotes:', err);
    } finally {
      setLoadingLotes(false);
    }
  };

  const loadHaciendaCategorias = async () => {
    const cacheKey = `categorias_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setHaciendaCategoriaOptions(cached); return; }
    setLoadingHaciendaCategorias(true);
    try {
      const token = await getToken();
      const response = await fetch(`https://api.finneg.com/api/haciendaCategoria/list?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`HaciendaCategoria request failed: ${response.status}`);
      const data = await response.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: item.nombre ?? item.Nombre ?? item.descripcion ?? item.Descripcion ?? item.codigo ?? item.Codigo ?? '',
          value: item.codigo ?? item.Codigo ?? item.value ?? '',
        }))
        .filter((item: SelectOption) => item.label && item.value);
      setHaciendaCategoriaOptions(options);
      await setCached(cacheKey, options);
    } catch (err: any) {
      console.error('Error loading haciendaCategoria:', err);
    } finally {
      setLoadingHaciendaCategorias(false);
    }
  };

  const loadDepositos = async () => {
    const cacheKey = `depositos_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setDepositoOptions(cached); return; }
    setLoadingDepositos(true);
    try {
      const token = await getToken();
      const response = await fetch(`https://api.finneg.com/api/depositos/list?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`Depositos request failed: ${response.status}`);
      const data = await response.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: item.nombre ?? item.Nombre ?? item.descripcion ?? item.Descripcion ?? item.codigo ?? item.Codigo ?? '',
          value: item.codigo ?? item.Codigo ?? item.value ?? '',
        }))
        .filter((item: SelectOption) => item.label && item.value);
      setDepositoOptions(options);
      await setCached(cacheKey, options);
    } catch (err: any) {
      console.error('Error loading depositos:', err);
    } finally {
      setLoadingDepositos(false);
    }
  };

  const loadProductosLeche = async () => {
    const cacheKey = `productos_leche_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setProductoLecheOptions(cached); return; }
    setLoadingProductosLeche(true);
    try {
      const token = await getToken();
      const response = await fetch(`https://api.finneg.com/api/reports/LECHEPRODUCCIONAPI?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`LECHEPRODUCCIONAPI request failed: ${response.status}`);
      const data = await response.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: (item.NOMBRE ?? item.Nombre ?? item.nombre ?? item.CODIGO ?? item.codigo ?? '').trim(),
          value: String(item.CODIGO ?? item.Codigo ?? item.codigo ?? '').trim(),
        }))
        .filter((item: SelectOption) => item.label && item.value)
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
      setProductoLecheOptions(options);
      await setCached(cacheKey, options);
    } catch (err: any) {
      console.error('Error loading productos leche:', err);
    } finally {
      setLoadingProductosLeche(false);
    }
  };

  useEffect(() => {
    loadLotes();
    loadHaciendaCategorias();
    loadDepositos();
    loadProductosLeche();
  }, []);

  const updateMovimientoField = (
    index: number,
    field: keyof MovimientoItem,
    value: string
  ) => {
    setMovimientos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addMovimiento = () => {
    setMovimientos((prev) => [...prev, createEmptyMovimientoItem()]);
  };

  const removeMovimiento = (index: number) => {
    setMovimientos((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const buildPayload = () => {
    const rawPayload = {
      IdentificacionExterna: identificacionExterna || null,
      TransaccionSubtipoCodigo: workflow.hacienda?.produccion?.codigo || transaccionSubtipoCodigo || null,
      Fecha: fecha || null,
      NumeroDocumento: numeroDocumento || null,
      CampanaCodigo: campanaCodigo || null,
      Descripcion: descripcion || null,
      MovimientoHaciendaProduccionLeche: movimientos.map((item) => ({
        ProductoCodigo: item.ProductoCodigo || null,
        LoteCodigo: item.LoteCodigo || null,
        Dosis: toNumberOrNull(item.Dosis),
        Grasa: toNumberOrNull(item.Grasa),
        UFC: toNumberOrNull(item.UFC),
        Acidez: toNumberOrNull(item.Acidez),
        Proteinas: toNumberOrNull(item.Proteinas),
        Temperatura: toNumberOrNull(item.Temperatura),
        CelSomaticas: toNumberOrNull(item.CelSomaticas),
        PartidaCodigo: item.PartidaCodigo || null,
        OrganizacionStockCodigo: item.OrganizacionStockCodigo || null,
      })),
      HaciendaCategoriaCodigo: haciendaCategoriaCodigo || null,
      LoteCodigo: loteCodigo || null,
      Cabezas: toNumberOrNull(cabezas),
      Tropa: tropa || null,
      EstablecimientoCodigo: selectedCompany?.value || null,
    };

    return cleanObject(rawPayload);
  };

  const submitProduccion = async () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná una empresa en Home antes de enviar.' });
      return;
    }
    setLoading(true);
    setError(null);

    const result = await addAndSubmit({
      formType: 'PRODUCCION',
      payload: buildPayload(),
      companyLabel: selectedCompany.label,
      lote: loteCodigo || null,
      categoria: haciendaCategoriaCodigo || null,
      cantidad: parseInt(cabezas) || null,
      deposito: movimientos[0]?.LoteCodigo || null,
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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <AntDesign
        size={200}
        color="white"
        name="product"
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
          Producción {selectedCompany ? `- ${selectedCompany.label}` : '- Sin empresa'}
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de Alta de Producción.</ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Campos principales</ThemedText>

        <InputField
          label="Fecha"
          value={fecha}
          onChangeText={setFecha}
        />

        <SearchableSelect
          label="HaciendaCategoriaCodigo"
          selectedValue={haciendaCategoriaCodigo}
          options={haciendaCategoriaOptions}
          onValueChange={setHaciendaCategoriaCodigo}
          placeholder="Seleccionar categoría..."
          loading={loadingHaciendaCategorias}
        />

        <SearchableSelect
          label="LoteCodigo"
          selectedValue={loteCodigo}
          options={loteOptions}
          onValueChange={setLoteCodigo}
          placeholder="Seleccionar lote..."
          loading={loadingLotes}
        />

        <InputField
          label="Cabezas"
          value={cabezas}
          onChangeText={setCabezas}
          keyboardType="numeric"
        />

        <InputField
          label="Descripcion (opcional)"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <ThemedText type="subtitle">Movimiento Hacienda Producción Leche</ThemedText>

        {movimientos.map((item, index) => (
          <ThemedView key={index} style={styles.miniForm}>
            <ThemedText style={styles.itemTitle}>
              Item {index + 1}
            </ThemedText>

            <SearchableSelect
              label="ProductoCodigo"
              selectedValue={item.ProductoCodigo}
              options={productoLecheOptions}
              onValueChange={(value) =>
                updateMovimientoField(index, 'ProductoCodigo', value)
              }
              placeholder="Seleccionar producto..."
              loading={loadingProductosLeche}
            />

            <SearchableSelect
              label="LoteCodigo"
              selectedValue={item.LoteCodigo}
              options={depositoOptions}
              onValueChange={(value) =>
                updateMovimientoField(index, 'LoteCodigo', value)
              }
              placeholder="Seleccionar depósito..."
              loading={loadingDepositos}
            />

            <InputField
              label="Dosis"
              value={item.Dosis}
              onChangeText={(text) =>
                updateMovimientoField(index, 'Dosis', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="Grasa (opcional)"
              value={item.Grasa}
              onChangeText={(text) =>
                updateMovimientoField(index, 'Grasa', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="UFC (opcional)"
              value={item.UFC}
              onChangeText={(text) =>
                updateMovimientoField(index, 'UFC', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="Acidez (opcional)"
              value={item.Acidez}
              onChangeText={(text) =>
                updateMovimientoField(index, 'Acidez', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="Proteinas (opcional)"
              value={item.Proteinas}
              onChangeText={(text) =>
                updateMovimientoField(index, 'Proteinas', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="Temperatura (opcional)"
              value={item.Temperatura}
              onChangeText={(text) =>
                updateMovimientoField(index, 'Temperatura', text)
              }
              keyboardType="numeric"
            />

            <InputField
              label="CelSomaticas (opcional)"
              value={item.CelSomaticas}
              onChangeText={(text) =>
                updateMovimientoField(index, 'CelSomaticas', text)
              }
              keyboardType="numeric"
            />

            {showOptionalFields && (
              <>
                <InputField
                  label="PartidaCodigo"
                  value={item.PartidaCodigo}
                  onChangeText={(text) =>
                    updateMovimientoField(index, 'PartidaCodigo', text)
                  }
                />

                <InputField
                  label="OrganizacionStockCodigo"
                  value={item.OrganizacionStockCodigo}
                  onChangeText={(text) =>
                    updateMovimientoField(index, 'OrganizacionStockCodigo', text)
                  }
                />
              </>
            )}

            <View style={styles.itemButtons}>
              <Button title="Agregar item" onPress={addMovimiento} />
              {movimientos.length > 1 && (
                <Button
                  title="Quitar item"
                  onPress={() => removeMovimiento(index)}
                  color="#b00020"
                />
              )}
            </View>
          </ThemedView>
        ))}

        {showOptionalFields && (
          <>
            <ThemedText type="subtitle">Campos opcionales generales</ThemedText>

            <InputField
              label="IdentificacionExterna"
              value={identificacionExterna}
              onChangeText={setIdentificacionExterna}
            />

            <InputField
              label="NumeroDocumento"
              value={numeroDocumento}
              onChangeText={setNumeroDocumento}
            />

            <InputField
              label="CampanaCodigo"
              value={campanaCodigo}
              onChangeText={setCampanaCodigo}
            />

            <InputField
              label="Tropa"
              value={tropa}
              onChangeText={setTropa}
            />
          </>
        )}

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
            await submitProduccion();
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
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  errorDetail: {
    color: '#fee2e2',
    fontSize: 13,
  },

});