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

/* ================= MAIN ================= */

export default function TabTwoScreen() {
  const { selectedCompany } = useCompany();
  const { user } = useAuth();
  const { addAndSubmit } = useSubmissions();
  const { workflow } = useWorkflow();
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
      TransaccionSubtipoCodigo: workflow.hacienda?.nacimientos?.codigo || transaccionSubtipoCodigo || 'NAC',
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
    <FormScreen
      title="NACIMIENTOS"
      subtitle="Alta de hacienda"
      company={selectedCompany?.label}
    >
      <FormSection title="Datos principales">
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
              label="Lote de destino"
              selectedValue={item.LoteDestino}
              options={loteOptions}
              onValueChange={(value) => updateItemField(index, 'LoteDestino', value)}
              placeholder="Seleccionar lote..."
              loading={loadingLotes}
            />

            <SearchableSelect
              label="Categoría de hacienda"
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
              onValueChange={(value) => updateItemField(index, 'Madre', value)}
              placeholder="Seleccionar madre..."
              loading={loadingCategorias}
            />

            <SearchableSelect
              label="Clasificación"
              selectedValue={item.EventoHaciendaClasificacionID}
              options={BIRTH_CLASIFICACION_OPTIONS}
              onValueChange={(value) =>
                updateItemField(index, 'EventoHaciendaClasificacionID', value)
              }
              placeholder="Seleccionar clasificación..."
            />

            <Field
              label="Cantidad de madres"
              value={item.CantidadMadres}
              onChangeText={(text) => updateItemField(index, 'CantidadMadres', text)}
              numeric
              optional
            />

            <Field
              label="Kg por cabeza de madre"
              value={item.CantidadKgsCabezaMadre}
              onChangeText={(text) =>
                updateItemField(index, 'CantidadKgsCabezaMadre', text)
              }
              numeric
              optional
            />

            <SearchableSelect
              label="CC madre"
              selectedValue={item.CCMadre}
              options={categoriaOptions}
              onValueChange={(value) => updateItemField(index, 'CCMadre', value)}
              placeholder="Seleccionar CC madre..."
              loading={loadingCategorias}
              optional
            />

            <SearchableSelect
              label="Hijo/s"
              selectedValue={item.Hijos}
              options={categoriaOptions}
              onValueChange={(value) => updateItemField(index, 'Hijos', value)}
              placeholder="Seleccionar hijo..."
              loading={loadingCategorias}
              optional
            />

            <Field
              label="Cabezas"
              value={item.Cab}
              onChangeText={(text) => updateItemField(index, 'Cab', text)}
              numeric
              optional
            />

            <Field
              label="Kg por cabeza"
              value={item.KgCab}
              onChangeText={(text) => updateItemField(index, 'KgCab', text)}
              numeric
              optional
            />

            <Field
              label="Tropa"
              value={item.Tropa}
              onChangeText={(text) => updateItemField(index, 'Tropa', text)}
              optional
            />

            <Field
              label="Cantidad de muertes"
              value={item.CantidadMuertes}
              onChangeText={(text) => updateItemField(index, 'CantidadMuertes', text)}
              numeric
              optional
            />

            <SearchableSelect
              label="Clasificación de muerte"
              selectedValue={item.ClasifMuerte}
              options={MUERTE_CLASIFICACION_OPTIONS}
              onValueChange={(value) => updateItemField(index, 'ClasifMuerte', value)}
              placeholder="Seleccionar clasificación..."
              optional
            />

            <SearchableSelect
              label="ID de madre"
              selectedValue={item.IDMadre}
              options={categoriaOptions}
              onValueChange={(value) => updateItemField(index, 'IDMadre', value)}
              placeholder="Seleccionar ID de madre..."
              loading={loadingCategorias}
              optional
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
          await submitNacimiento();
        }}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </FormScreen>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  footer: { gap: Spacing.md },
});