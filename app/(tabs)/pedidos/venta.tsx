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
    const cacheKey = `productos_venta_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setProductoOptions(cached); return; }
    setLoadingProductos(true);
    try {
      const token = await getToken();
      const response = await fetch(`https://api.finneg.com/api/reports/PRODUCTOSVENTAAPI?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`PRODUCTOSVENTAAPI request failed: ${response.status}`);
      const data = await response.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: (item.NOMBRE ?? item.Nombre ?? item.nombre ?? '').trim(),
          value: String(item.CODIGO ?? item.Codigo ?? item.codigo ?? '').trim(),
        }))
        .filter((item: SelectOption) => item.label && item.value)
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
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
    <FormScreen
      title="PEDIDO"
      subtitle="de venta"
      company={selectedCompany?.label}
    >
      <FormSection title="Datos del pedido">
        <Field label="Fecha" value={fecha} onChangeText={setFecha} />

        <SearchableSelect
          label="Cliente"
          selectedValue={clienteCodigo}
          options={clienteOptions}
          onValueChange={setClienteCodigo}
          placeholder="Seleccionar cliente..."
          loading={loadingClientes}
        />

        <Field label="Descripción" value={descripcion} onChangeText={setDescripcion} />
      </FormSection>

      <FormSection title="Ítems">
        {items.map((item, index) => (
          <ItemCard
            key={index}
            index={index}
            total={items.length}
            onRemove={items.length > 1 ? () => removeItem(index) : undefined}
          >
            <SearchableSelect
              label="Producto"
              selectedValue={item.ProductoCodigo}
              options={productoOptions}
              onValueChange={(value) => updateItem(index, 'ProductoCodigo', value)}
              placeholder="Seleccionar producto..."
              loading={loadingProductos}
            />

            <Field
              label="Cantidad"
              value={item.Cantidad}
              onChangeText={(text) => updateItem(index, 'Cantidad', text)}
              numeric
            />

            <Field
              label="Precio"
              value={item.Precio}
              onChangeText={(text) => updateItem(index, 'Precio', text)}
              numeric
            />

            <Field
              label="Descripción"
              value={item.Descripcion}
              onChangeText={(text) => updateItem(index, 'Descripcion', text)}
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
          await submitVenta();
        }}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: Spacing.md },
});
