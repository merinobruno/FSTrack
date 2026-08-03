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

export default function PedidoCompraScreen() {
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
    const cacheKey = `productos_compra_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached) { setProductoOptions(cached); return; }
    setLoadingProductos(true);
    try {
      const token = await getToken();
      const response = await fetch(`https://api.finneg.com/api/reports/PRODUCTOSCOMPRAAPI?ACCESS_TOKEN=${token}`);
      if (!response.ok) throw new Error(`PRODUCTOSCOMPRAAPI request failed: ${response.status}`);
      const data = await response.json();
      // El SP (SP_BS_ProductosCompra) ya filtra Activo=1 y los productos comprables
      // del lado del servidor, y devuelve solo Nombre/Codigo — no se filtra en cliente.
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          label: (item.NOMBRE ?? item.Nombre ?? item.nombre ?? item.DESCRIPCION ?? item.descripcion ?? item.CODIGO ?? item.Codigo ?? item.codigo ?? '').trim(),
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
    <FormScreen
      title="PEDIDO"
      subtitle="de compra"
      company={selectedCompany?.label}
    >
      <FormSection title="Datos del pedido">
        <Field label="Fecha" value={fecha} onChangeText={setFecha} />
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
          await submitCompra();
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
