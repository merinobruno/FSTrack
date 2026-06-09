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

type CompraItem = {
  ProductoCodigo: string;
  Cantidad: string;
  Descripcion: string;
};

const createEmptyItem = (): CompraItem => ({
  ProductoCodigo: '',
  Cantidad: '',
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

export default function PedidoCompraScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { addAndSubmit } = useSubmissions();
  const { workflow } = useWorkflow();

  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [productoOptions, setProductoOptions] = useState<SelectOption[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  const [fecha, setFecha] = useState(getTodayDate());
  const [descripcion, setDescripcion] = useState('');
  const [items, setItems] = useState<CompraItem[]>([createEmptyItem()]);

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

  useEffect(() => { loadProductos(); }, []);

  const updateItem = (index: number, field: keyof CompraItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const buildPayload = () =>
    cleanObject({
      WorkflowCodigo: workflow.compra?.codigo || null,
      Fecha: fecha || null,
      EmpresaCodigo: selectedCompany?.value || null,
      TransaccionSubtipoCodigo: workflow.compra?.subtipoCodigo || null, // TipoDocumento asignado al workflow (admin)
      TransaccionTipoCodigo: 'OPER',
      Descripcion: descripcion || null,
      Items: items.map((item) => ({
        ProductoCodigo: item.ProductoCodigo || null,
        Cantidad: toNumberOrNull(item.Cantidad),
        Descripcion: item.Descripcion || null,
      })),
    });

  const handleSendPress = () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná una empresa en Home antes de enviar.' });
      return;
    }
    if (!workflow.compra) {
      setError({ title: 'Esta cuenta no tiene un workflow de compra asignado. Contactá al administrador.' });
      return;
    }
    if (!workflow.compra.subtipoCodigo) {
      setError({ title: 'Esta cuenta no tiene un tipo de documento asignado al workflow de compra. Contactá al administrador.' });
      return;
    }
    setConfirmVisible(true);
  };

  const submitCompra = async () => {
    setLoading(true);
    setError(null);
    const result = await addAndSubmit({
      formType: 'PEDIDO_COMPRA',
      payload: buildPayload(),
      companyLabel: selectedCompany?.label ?? null,
    });
    setLoading(false);
    if (result.status === 'error') setError({ title: result.title, detail: result.detail });
    else router.back();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#b8d4f5', dark: '#1a2535' }}
      headerImage={
        <MaterialCommunityIcons
          size={200}
          color="white"
          name="cart-outline"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Pedido de Compra{selectedCompany ? ` - ${selectedCompany.label}` : ' - Sin empresa'}
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de Pedido de Compra.</ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Datos del pedido</ThemedText>

        <InputField label="Fecha" value={fecha} onChangeText={setFecha} />
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
          onConfirm={async () => { setConfirmVisible(false); await submitCompra(); }}
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
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  errorTitle: { color: '#b91c1c', fontSize: 14, fontWeight: '600' as const },
  errorDetail: { color: '#b91c1c', fontSize: 13, opacity: 0.85 },
});
