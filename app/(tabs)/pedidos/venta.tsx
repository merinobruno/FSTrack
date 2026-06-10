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
import { SearchableSelect } from '@/components/searchable-select';
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

type SelectOption = { label: string; value: string };

type VentaItem = {
  ProductoCodigo: string;
  Cantidad: string;
  CantidadPresentacion: string;
  Cantidad2: string;
  Precio: string;
  PrecioBase: string;
  PrecioTipo: string;
  Descuento1: string;
  Descuento2: string;
  FechaProximoPaso: string;
  USRFechaEntrega: string;
  Descripcion: string;
};

const createEmptyItem = (): VentaItem => ({
  ProductoCodigo: '',
  Cantidad: '1',
  CantidadPresentacion: '',
  Cantidad2: '',
  Precio: '',
  PrecioBase: '',
  PrecioTipo: '1',
  Descuento1: '0',
  Descuento2: '0',
  FechaProximoPaso: getTodayDate(),
  USRFechaEntrega: getTodayDate(),
  Descripcion: '',
});

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
};

function InputField({ label, value, onChangeText, keyboardType = 'default' }: InputFieldProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  return (
    <>
      <ThemedText>{label}</ThemedText>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? '#1f1f1f' : '#ebebeb', borderColor: isDark ? '#555' : '#999' },
        ]}
      >
        <TextInput
          style={[styles.input, { color: isDark ? '#fff' : '#111', backgroundColor: 'transparent' }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={isDark ? '#aaa' : '#666'}
        />
      </View>
    </>
  );
}

export default function PedidoVentaScreen() {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { addAndSubmit } = useSubmissions();
  const { workflow } = useWorkflow();

  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [productoOptions, setProductoOptions] = useState<SelectOption[]>([]);
  const [clienteOptions, setClienteOptions] = useState<SelectOption[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Header fields
  const [fecha, setFecha] = useState(getTodayDate());
  const [clienteCodigo, setClienteCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [items, setItems] = useState<VentaItem[]>([createEmptyItem()]);

  const getToken = async () => {
    if (!user?.token) throw new Error('No autenticado.');
    return getFinnegansToken(user.token);
  };

  const loadProductos = async () => {
    const cacheKey = `productos_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setProductoOptions(cached); return; }
    setLoadingProductos(true);
    try {
      const token = await getToken();
      const response = await fetch(`https://api.finneg.com/api/Producto/list?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`Producto request failed: ${response.status}`);
      const data = await response.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: item.nombre ?? item.Nombre ?? item.descripcion ?? item.Descripcion ?? item.codigo ?? item.Codigo ?? '',
          value: item.codigo ?? item.Codigo ?? '',
        }))
        .filter((item: SelectOption) => item.label && item.value);
      setProductoOptions(options);
      await setCached(cacheKey, options);
    } catch (err: any) {
      console.error('Error loading productos:', err);
    } finally {
      setLoadingProductos(false);
    }
  };

  const loadClientes = async () => {
    const cacheKey = `clientes_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setClienteOptions(cached); return; }
    setLoadingClientes(true);
    try {
      const token = await getToken();
      const response = await fetch(`https://api.finneg.com/api/Cliente/list?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`Cliente request failed: ${response.status}`);
      const data = await response.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: item.nombre ?? item.Nombre ?? item.razonSocial ?? item.RazonSocial ?? item.descripcion ?? item.Descripcion ?? item.codigo ?? item.Codigo ?? '',
          value: item.codigo ?? item.Codigo ?? '',
        }))
        .filter((item: SelectOption) => item.label && item.value);
      setClienteOptions(options);
      await setCached(cacheKey, options);
    } catch (err: any) {
      console.error('Error loading clientes:', err);
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    loadProductos();
    loadClientes();
  }, []);

  const updateItem = (index: number, field: keyof VentaItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const buildPayload = () =>
    cleanObject({
      WorkflowCodigo: workflow.venta?.codigo || null,
      Fecha: fecha || null,
      EmpresaCodigo: selectedCompany?.value || null,
      TransaccionSubtipoCodigo: workflow.venta?.subtipoCodigo || null, // TipoDocumento asignado al workflow (admin)
      Cliente: clienteCodigo || null,
      TransaccionTipoCodigo: 'OPER',
      Descripcion: descripcion || null,
      Items: items.map((item) => ({
        ProductoCodigo: item.ProductoCodigo || null,
        Cantidad: toNumberOrNull(item.Cantidad),
        CantidadPresentacion: toNumberOrNull(item.CantidadPresentacion),
        Cantidad2: toNumberOrNull(item.Cantidad2),
        Precio: toNumberOrNull(item.Precio),
        PrecioBase: toNumberOrNull(item.PrecioBase),
        PrecioTipo: toNumberOrNull(item.PrecioTipo),
        Descuento1: toNumberOrNull(item.Descuento1),
        Descuento2: toNumberOrNull(item.Descuento2),
        FechaProximoPaso: item.FechaProximoPaso || null,
        USRFechaEntrega: item.USRFechaEntrega || null,
        Descripcion: item.Descripcion || null,
      })),
    });

  const handleSendPress = () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná una empresa en Home antes de enviar.' });
      return;
    }
    if (!workflow.venta) {
      setError({ title: 'Esta cuenta no tiene un workflow de venta asignado. Contactá al administrador.' });
      return;
    }
    if (!workflow.venta.subtipoCodigo) {
      setError({ title: 'Esta cuenta no tiene un tipo de documento asignado al workflow de venta. Contactá al administrador.' });
      return;
    }
    setConfirmVisible(true);
  };

  const submitVenta = async () => {
    setLoading(true);
    setError(null);
    const result = await addAndSubmit({
      formType: 'PEDIDO_VENTA',
      payload: buildPayload(),
      companyLabel: selectedCompany?.label ?? null,
    });
    setLoading(false);
    if (result.status === 'error') setError({ title: result.title, detail: result.detail });
    else router.back();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#b8e8d4', dark: '#0f2d1f' }}
      headerImage={
        <MaterialCommunityIcons
          size={200}
          color="white"
          name="tag-outline"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Pedido de Venta{selectedCompany ? ` - ${selectedCompany.label}` : ' - Sin empresa'}
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de Pedido de Venta.</ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Datos del pedido</ThemedText>

        <InputField label="Fecha" value={fecha} onChangeText={setFecha} />

        <SearchableSelect
          label="Cliente"
          selectedValue={clienteCodigo}
          options={clienteOptions}
          onValueChange={setClienteCodigo}
          placeholder="Seleccionar cliente..."
          loading={loadingClientes}
        />

        <InputField label="Descripcion" value={descripcion} onChangeText={setDescripcion} />

        <ThemedText type="subtitle">Ítems</ThemedText>

        {items.map((item, index) => (
          <ThemedView key={index} style={styles.miniForm}>
            <ThemedText style={styles.itemTitle}>Ítem {index + 1}</ThemedText>

            <SearchableSelect
              label="ProductoCodigo"
              selectedValue={item.ProductoCodigo}
              options={productoOptions}
              onValueChange={(value) => updateItem(index, 'ProductoCodigo', value)}
              placeholder="Seleccionar producto..."
              loading={loadingProductos}
            />

            <InputField
              label="Cantidad"
              value={item.Cantidad}
              onChangeText={(text) => updateItem(index, 'Cantidad', text)}
              keyboardType="numeric"
            />

            <InputField
              label="CantidadPresentacion"
              value={item.CantidadPresentacion}
              onChangeText={(text) => updateItem(index, 'CantidadPresentacion', text)}
              keyboardType="numeric"
            />

            <InputField
              label="Cantidad2"
              value={item.Cantidad2}
              onChangeText={(text) => updateItem(index, 'Cantidad2', text)}
              keyboardType="numeric"
            />

            <InputField
              label="Precio"
              value={item.Precio}
              onChangeText={(text) => updateItem(index, 'Precio', text)}
              keyboardType="numeric"
            />

            <InputField
              label="PrecioBase"
              value={item.PrecioBase}
              onChangeText={(text) => updateItem(index, 'PrecioBase', text)}
              keyboardType="numeric"
            />

            <InputField
              label="PrecioTipo"
              value={item.PrecioTipo}
              onChangeText={(text) => updateItem(index, 'PrecioTipo', text)}
              keyboardType="numeric"
            />

            <InputField
              label="Descuento1"
              value={item.Descuento1}
              onChangeText={(text) => updateItem(index, 'Descuento1', text)}
              keyboardType="numeric"
            />

            <InputField
              label="Descuento2"
              value={item.Descuento2}
              onChangeText={(text) => updateItem(index, 'Descuento2', text)}
              keyboardType="numeric"
            />

            <InputField
              label="FechaProximoPaso"
              value={item.FechaProximoPaso}
              onChangeText={(text) => updateItem(index, 'FechaProximoPaso', text)}
            />

            <InputField
              label="USRFechaEntrega"
              value={item.USRFechaEntrega}
              onChangeText={(text) => updateItem(index, 'USRFechaEntrega', text)}
            />

            <InputField
              label="Descripcion"
              value={item.Descripcion}
              onChangeText={(text) => updateItem(index, 'Descripcion', text)}
            />

            <View style={styles.itemButtons}>
              <Button title="Agregar ítem" onPress={addItem} />
              {items.length > 1 && (
                <Button title="Quitar ítem" onPress={() => removeItem(index)} color="#b00020" />
              )}
            </View>
          </ThemedView>
        ))}

        <Button title={loading ? 'Enviando...' : 'Enviar'} onPress={handleSendPress} disabled={loading} />
        {loading && <ActivityIndicator />}

        {error && (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorTitle}>{error.title}</ThemedText>
            {error.detail && <ThemedText style={styles.errorDetail}>{error.detail}</ThemedText>}
          </View>
        )}
        <SendConfirmationModal
          visible={confirmVisible}
          title="¿Estás seguro?"
          payload={buildPayload()}
          onCancel={() => setConfirmVisible(false)}
          onConfirm={async () => { setConfirmVisible(false); await submitVenta(); }}
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
  itemTitle: { fontSize: 16, fontWeight: '600' },
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
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  errorTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' as const },
  errorDetail: { color: '#fee2e2', fontSize: 13 },
});
