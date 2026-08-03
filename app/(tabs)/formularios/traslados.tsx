import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Field,
  FormScreen,
  FormSection,
  ItemCard,
  ItemGroup,
  SecondaryButton,
  StatusBox,
} from '@/components/brand';
import { SearchableSelect, SelectOption } from '@/components/searchable-select';
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
          !(typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0)
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
          !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* ================= TYPES ================= */

type Item = {
  EventoHaciendaID: string;
  LoteOrigen: string;
  CategoriaOrigen: string;
  EstablecimientoDestino: string;
  LoteDestino: string;
  CategoriaDestino: string;
  KgCab: string;
  Cab: string;
  Clasificacion: string;
  Tropa: string;
};

const createEmptyItem = (): Item => ({
  EventoHaciendaID: '',
  LoteOrigen: '',
  CategoriaOrigen: '',
  EstablecimientoDestino: '',
  LoteDestino: '',
  CategoriaDestino: '',
  KgCab: '',
  Cab: '',
  Clasificacion: '',
  Tropa: '',
});

/* ================= MAIN ================= */

export default function TrasladosScreen() {
  const { selectedCompany, companies } = useCompany();
  const { user } = useAuth();
  const { addAndSubmit } = useSubmissions();
  const { workflow } = useWorkflow();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [loteOptions, setLoteOptions] = useState<SelectOption[]>([]);
  const [categoriaOptions, setCategoriaOptions] = useState<SelectOption[]>([]);
  const [eventoOptions, setEventoOptions] = useState<SelectOption[]>([]);
  const [clasificacionOptions, setClasificacionOptions] = useState<SelectOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [loadingClasificaciones, setLoadingClasificaciones] = useState(false);

  const [fecha, setFecha] = useState(getTodayDate());
  const [descripcion, setDescripcion] = useState('');
  const [numeroComprobante, setNumeroComprobante] = useState('');

  const [items, setItems] = useState<Item[]>([createEmptyItem()]);

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
      const res = await fetch(`https://api.finneg.com/api/Lote/list?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`Lote request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((l: any) => ({
          label: l.nombre ?? l.Nombre ?? l.codigo ?? '',
          value: l.codigo ?? '',
        }))
        .filter((o: SelectOption) => o.label && o.value);
      setLoteOptions(options);
      await setCached(cacheKey, options);
    } catch (e: any) {
      setError({ title: e.message || 'Error cargando lotes' });
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
      const res = await fetch(`https://api.finneg.com/api/haciendaCategoria/list?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`Categoria request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((c: any) => ({
          label: c.nombre ?? c.Nombre ?? c.descripcion ?? c.codigo ?? '',
          value: c.codigo ?? '',
        }))
        .filter((o: SelectOption) => o.label && o.value);
      setCategoriaOptions(options);
      await setCached(cacheKey, options);
    } catch (e: any) {
      setError({ title: e.message || 'Error cargando categorías' });
    } finally {
      setLoadingCategorias(false);
    }
  };

  const loadEventos = async () => {
    const cacheKey = `eventos_hac_cod_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached?.length) { setEventoOptions(cached); return; }
    setLoadingEventos(true);
    try {
      const token = await getToken();
      const res = await fetch(`https://api.finneg.com/api/EventoHacienda/list?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`EventoHacienda request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((e: any) => ({
          label: e.Nombre ?? e.nombre ?? '',
          value: e.Codigo ?? e.codigo ?? '',
        }))
        .filter((o: SelectOption) => o.label && o.value)
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
      setEventoOptions(options);
      await setCached(cacheKey, options);
    } catch (e: any) {
      setError({ title: e.message || 'Error cargando eventos de hacienda' });
    } finally {
      setLoadingEventos(false);
    }
  };

  const loadClasificaciones = async () => {
    const cacheKey = `clasif_evento_${user?.domainId}`;
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached?.length) { setClasificacionOptions(cached); return; }
    setLoadingClasificaciones(true);
    try {
      const token = await getToken();
      const res = await fetch(`https://api.finneg.com/api/reports/EventoHaciendaClasificacion?ACCESS_TOKEN=${token}`);
      if (!res.ok) throw new Error(`EventoHaciendaClasificacion request failed: ${res.status}`);
      const data = await res.json();
      const options: SelectOption[] = (Array.isArray(data) ? data : [])
        .map((c: any) => ({
          label: c.NOMBRE ?? c.Nombre ?? c.nombre ?? '',
          value: c.CODIGO ?? c.Codigo ?? c.codigo ?? '',
        }))
        .filter((o: SelectOption) => o.label && o.value)
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
      setClasificacionOptions(options);
      await setCached(cacheKey, options);
    } catch (e: any) {
      setError({ title: e.message || 'Error cargando clasificaciones' });
    } finally {
      setLoadingClasificaciones(false);
    }
  };

  useEffect(() => {
    loadLotes();
    loadCategorias();
    loadEventos();
    loadClasificaciones();
  }, []);

  /* ================= ITEMS ================= */

  const updateItem = (i: number, field: keyof Item, val: string) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  /* ================= PAYLOAD ================= */

  const buildPayload = () => {
    return cleanObject({
      Fecha: fecha,
      TransaccionTipo: 'OPER',
      TransaccionSubtipoCodigo: workflow.hacienda?.traslados?.codigo || 'TRA-CAT',
      EmpresaCodigo: selectedCompany?.value || null,
      Descripcion: descripcion || null,
      NumeroComprobante: numeroComprobante || null,
      Items: items.map((item) => {
        const kgCab = toNumberOrNull(item.KgCab) ?? 0;
        const cab = toNumberOrNull(item.Cab) ?? 0;
        return {
          EventoHaciendaID: item.EventoHaciendaID || null,
          LoteOrigen: item.LoteOrigen || null,
          LoteDestino: item.LoteDestino || null,
          CodigoCategoriahacienda: item.CategoriaOrigen || null,
          CodigoCategoriahaciendaDestino: item.CategoriaDestino || null,
          EstablecimientoDestino: item.EstablecimientoDestino || null,
          Cab: cab || null,
          'Kg/cab': kgCab || null,
          KgTotales: kgCab && cab ? kgCab * cab : null,
          EventoHaciendaClasificacionID: item.Clasificacion || null,
          Tropa: item.Tropa || null,
        };
      }),
    });
  };

  /* ================= SEND ================= */

  const submitTraslados = async () => {
    if (!selectedCompany) {
      setError({ title: 'Seleccioná una empresa en Home antes de enviar.' });
      return;
    }
    setLoading(true);
    setError(null);

    const result = await addAndSubmit({
      formType: 'TRASLADOS',
      payload: buildPayload(),
      companyLabel: selectedCompany.label,
      lote: items[0]?.LoteOrigen || null,
      categoria: items[0]?.CategoriaOrigen || null,
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
      title="TRASLADOS"
      subtitle="y cambios de categoría"
      company={selectedCompany?.label}
    >
      <FormSection title="Datos principales">
        <Field label="Fecha" value={fecha} onChangeText={setFecha} />
        <Field label="Descripción" value={descripcion} onChangeText={setDescripcion} />
      </FormSection>

      <FormSection title="Ítems">
        {items.map((item, i) => {
          const kgCab = toNumberOrNull(item.KgCab) ?? 0;
          const cab = toNumberOrNull(item.Cab) ?? 0;
          const kg = kgCab && cab ? (kgCab * cab).toFixed(2) : '';

          return (
            <ItemCard
              key={i}
              index={i}
              total={items.length}
              onRemove={items.length > 1 ? () => removeItem(i) : undefined}
            >
              <SearchableSelect
                label="Evento de hacienda"
                selectedValue={item.EventoHaciendaID}
                options={eventoOptions}
                onValueChange={(v) => updateItem(i, 'EventoHaciendaID', v)}
                placeholder="Seleccionar evento..."
                loading={loadingEventos}
              />

              <ItemGroup label="Origen">
                <SearchableSelect
                  label="Lote"
                  selectedValue={item.LoteOrigen}
                  options={loteOptions}
                  onValueChange={(v) => updateItem(i, 'LoteOrigen', v)}
                  placeholder="Seleccionar lote..."
                  loading={loadingLotes}
                />

                <SearchableSelect
                  label="Categoría"
                  selectedValue={item.CategoriaOrigen}
                  options={categoriaOptions}
                  onValueChange={(v) => updateItem(i, 'CategoriaOrigen', v)}
                  placeholder="Seleccionar categoría..."
                  loading={loadingCategorias}
                />
              </ItemGroup>

              <ItemGroup label="Destino">
                <SearchableSelect
                  label="Establecimiento"
                  selectedValue={item.EstablecimientoDestino}
                  options={companies}
                  onValueChange={(v) => updateItem(i, 'EstablecimientoDestino', v)}
                  placeholder="Seleccionar establecimiento..."
                />

                <SearchableSelect
                  label="Lote"
                  selectedValue={item.LoteDestino}
                  options={loteOptions}
                  onValueChange={(v) => updateItem(i, 'LoteDestino', v)}
                  placeholder="Seleccionar lote..."
                  loading={loadingLotes}
                />

                <SearchableSelect
                  label="Categoría"
                  selectedValue={item.CategoriaDestino}
                  options={categoriaOptions}
                  onValueChange={(v) => updateItem(i, 'CategoriaDestino', v)}
                  placeholder="Seleccionar categoría..."
                  loading={loadingCategorias}
                />

                <SearchableSelect
                  label="Clasificación"
                  selectedValue={item.Clasificacion}
                  options={clasificacionOptions}
                  onValueChange={(v) => updateItem(i, 'Clasificacion', v)}
                  placeholder="Seleccionar clasificación..."
                  loading={loadingClasificaciones}
                />
              </ItemGroup>

              <ItemGroup label="Movimiento">
                <Field
                  label="Kg por cabeza"
                  value={item.KgCab}
                  onChangeText={(v: string) => updateItem(i, 'KgCab', v)}
                  numeric
                  optional
                />

                <Field
                  label="Cabezas"
                  value={item.Cab}
                  onChangeText={(v: string) => updateItem(i, 'Cab', v)}
                  numeric
                  optional
                />

                <Field
                  label="Kg totales"
                  value={kg}
                  onChangeText={() => {}}
                  numeric
                  editable={false}
                  hint="Se calcula como cabezas × kg por cabeza."
                />

                <Field
                  label="Tropa"
                  value={item.Tropa}
                  onChangeText={(v: string) => updateItem(i, 'Tropa', v)}
                  optional
                />
              </ItemGroup>
            </ItemCard>
          );
        })}

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
          await submitTraslados();
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
