import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Field,
  FormScreen,
  FormSection,
  ItemCard,
  SecondaryButton,
  StatusBox,
} from '@/components/brand';
import { SearchableSelect, SelectOption } from '@/components/searchable-select';
import SendConfirmationModal from '@/components/SendConfirmationModal';
import { FontFamily, Palette, Semantic, Spacing, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useSubmissions } from '@/contexts/SubmissionsContext';
import { ApiError } from '@/utils/api-error';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import { getCached, setCached } from '@/utils/options-cache';

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
  const [tipoLoadError, setTipoLoadError] = useState<string | null>(null);
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

  const findFirstArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];
    for (const nested of Object.values(value)) {
      const rows = findFirstArray(nested);
      if (rows.length > 0) return rows;
    }
    return [];
  };

  const str = (v: any) => (v !== null && v !== undefined ? String(v).trim() : '');

  // Finds the deepest object that has BOTH nombre and apellido populated —
  // avoids picking up nombre from a company/cargo sub-object.
  const findPersonObject = (obj: any, seen = new Set<any>()): { nombre: string; apellido: string } | null => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || seen.has(obj)) return null;
    seen.add(obj);
    const n = str(obj.nombre ?? obj.Nombre ?? obj.NOMBRE);
    const a = str(obj.apellido ?? obj.Apellido ?? obj.APELLIDO);
    if (n && a) return { nombre: n, apellido: a };
    for (const v of Object.values(obj)) {
      const found = findPersonObject(v, seen);
      if (found) return found;
    }
    return null;
  };

  const mapOptions = (data: any): SelectOption[] => {
    const rows = Array.isArray(data)
      ? data
      : data?.data ?? data?.Data ?? data?.DATA ??
        data?.rows ?? data?.Rows ?? data?.ROWS ??
        data?.result ?? data?.Result ?? data?.RESULT ??
        data?.items ?? data?.Items ??
        findFirstArray(data);

    return (Array.isArray(rows) ? rows : [])
      .map((item: any) => {
        // Extract the employee code from common field names
        const codeFields = [
          'codigo', 'Codigo', 'CODIGO',
          'personaCodigo', 'PersonaCodigo',
          'empleadoCodigo', 'EmpleadoCodigo',
          'legajoCodigo', 'LegajoCodigo',
          'cuit', 'Cuit', 'CUIT',
          'email', 'Email', 'EMAIL',
          'value',
        ];
        let value = '';
        for (const k of codeFields) {
          const v = str(item?.[k]);
          if (v) { value = v; break; }
        }

        // Find the person name from the object that has BOTH nombre+apellido together
        const person = findPersonObject(item);
        let nameStr = '';
        if (person) {
          nameStr = [person.apellido, person.nombre].filter(Boolean).join(', ');
        } else {
          // Fallback: use descripcion or razonSocial
          nameStr = str(item?.descripcion ?? item?.Descripcion ?? item?.razonSocial ?? item?.RazonSocial ?? '');
        }

        // Always show code alongside name so the user can identify the record
        const label = nameStr ? `${nameStr}  ·  ${value}` : value;

        return { label, value };
      })
      .filter((item: SelectOption) => item.label && item.value);
  };

  const loadOptions = async (
    cacheKey: string,
    endpoint: string,
    setOptions: (options: SelectOption[]) => void,
    setLoadingState: (loading: boolean) => void,
    onError?: (msg: string) => void
  ) => {
    const cached = await getCached<SelectOption[]>(cacheKey);
    if (cached && cached.length > 0) {
      setOptions(cached);
      onError?.('' );
      return;
    }

    setLoadingState(true);
    onError?.('');
    try {
      const token = await getToken();
      const response = await fetch(`${endpoint}?ACCESS_TOKEN=${token}`);
      if (!response.ok) {
        onError?.(`Error ${response.status}: ${response.statusText}`);
        return;
      }
      const options = mapOptions(await response.json());
      setOptions(options);
      if (options.length > 0) {
        await setCached(cacheKey, options);
      } else {
        onError?.('La API no devolvió opciones para este dominio.');
      }
    } catch (e: any) {
      onError?.(e?.message ?? 'No se pudo conectar con Finnegans.');
    } finally {
      setLoadingState(false);
    }
  };

  const loadTipos = () => {
    if (!user?.token) return;
    const domainId = user?.domainId ?? 'default';
    loadOptions(
      `tipos_novedad_sueldo_${domainId}`,
      'https://api.finneg.com/api/TIPONOVEDADLIQUIDACIONSUELDOS/list',
      setTipoOptions,
      setLoadingTipos,
      setTipoLoadError
    );
  };

  useEffect(() => {
    if (!user?.token) return;
    const domainId = user?.domainId ?? 'default';
    loadTipos();
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
    if (result.status === 'error') setError({ title: result.title, detail: result.detail });
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
    <FormScreen
      title="NOVEDADES"
      subtitle="de sueldo"
      company={selectedCompany?.label}
    >
      <FormSection title="Datos principales">
        {selectedCompany && (
          <View style={styles.companyRow}>
            <Text style={styles.companyLabel}>Código de empresa</Text>
            <Text style={styles.companyValue}>{selectedCompany.value}</Text>
          </View>
        )}

        <Field label="Fecha" value={fecha} onChangeText={setFecha} />
        <Field label="Descripcion" value={descripcion} onChangeText={setDescripcion} />
      </FormSection>

      <FormSection title="Legajos">
        {items.map((item, index) => (
          <ItemCard
            key={index}
            index={index}
            total={items.length}
            onRemove={items.length > 1 ? () => removeItem(index) : undefined}
          >
            {tipoOptions.length > 0 ? (
              <SearchableSelect
                label="Tipo de novedad"
                selectedValue={item.TipoNovedadCodigo}
                options={tipoOptions}
                onValueChange={(value) => updateItemField(index, 'TipoNovedadCodigo', value)}
                placeholder="Seleccionar tipo de novedad..."
                loading={loadingTipos}
              />
            ) : (
              <View style={styles.fallback}>
                <Field
                  label="Tipo de novedad"
                  value={item.TipoNovedadCodigo}
                  onChangeText={(text) => updateItemField(index, 'TipoNovedadCodigo', text)}
                  placeholder="Código manual (ej: VACACIONES)"
                />
                {loadingTipos ? null : (
                  <>
                    <StatusBox
                      variant="pending"
                      title={tipoLoadError ?? 'No se encontraron tipos para este dominio.'}
                      detail="Podés cargar el código a mano o reintentar."
                    />
                    <SecondaryButton title="Reintentar" onPress={loadTipos} />
                  </>
                )}
              </View>
            )}

            <SearchableSelect
              label="Empleado"
              selectedValue={item.PersonaCodigo}
              options={personaOptions}
              onValueChange={(value) => updateItemField(index, 'PersonaCodigo', value)}
              placeholder="Seleccionar empleado..."
              loading={loadingPersonas}
            />
            {!loadingPersonas && personaOptions.length === 0 && (
              <Text style={styles.helpText}>
                No se encontraron empleados para mostrar.
              </Text>
            )}

            <Field
              label="Valor"
              value={item.Valor}
              onChangeText={(text) => updateItemField(index, 'Valor', text)}
              numeric
            />
            <Field
              label="Fecha"
              value={item.Fecha}
              onChangeText={(text) => updateItemField(index, 'Fecha', text)}
            />
            <Field
              label="Descripcion"
              value={item.Descripcion}
              onChangeText={(text) => updateItemField(index, 'Descripcion', text)}
            />
          </ItemCard>
        ))}

        <SecondaryButton title="Agregar item" onPress={addItem} />
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
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: Spacing.md },
  fallback: { gap: Spacing.md },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.md,
  },
  companyLabel: {
    ...Type.label,
    fontFamily: FontFamily.medium,
    color: Palette.steelText,
  },
  companyValue: {
    ...Type.body,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
  },
  helpText: {
    ...Type.caption,
    color: Semantic.pending,
  },
});
