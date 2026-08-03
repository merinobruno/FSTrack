import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PairedHeading, Panel, Screen } from '@/components/brand';
import {
  Effects,
  FontFamily,
  Palette,
  Radius,
  Semantic,
  Spacing,
  Type,
} from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

// Line prefixes:
//   '• '  → bullet item (consecutive bullets are grouped into a block)
//   '! '  → highlighted info / tip box
//   ends with ':'  → sub-label inside the body
//   plain text    → paragraph
type GuideSection = {
  icon: string;
  title: string;
  lines: string[];
};

const USER_SECTIONS: GuideSection[] = [
  {
    icon: 'login',
    title: 'Iniciar sesión',
    lines: [
      'Para acceder a la app necesitás tres datos que te provee el administrador:',
      '• Dominio — identifica a tu organización (ej: "fisterra").',
      '• Cuenta — tu nombre de usuario dentro del dominio.',
      '• Contraseña — asignada por el administrador al crear tu cuenta.',
      '! La sesión se mantiene activa 7 días. Si la app te redirige al login es porque expiró — volvé a ingresar tus datos.',
    ],
  },
  {
    icon: 'office-building',
    title: 'Seleccionar empresa',
    lines: [
      'Antes de poder enviar cualquier formulario o pedido, debés elegir el establecimiento con el que estás trabajando.',
      'Cómo hacerlo:',
      '• Abrí la pestaña Home (ícono de casa).',
      '• Desplegá el selector "Empresa" y elegí el establecimiento.',
      '• La selección queda guardada mientras uses la app.',
      '! Sin empresa seleccionada, Finnegans rechazará todos los envíos. Siempre verificá que esté elegida antes de cargar datos.',
    ],
  },
  {
    icon: 'clipboard-edit-outline',
    title: 'Formularios de ganadería',
    lines: [
      'Desde la pestaña Formularios podés registrar los movimientos diarios de hacienda. Hay cinco tipos:',
      '• Producción de Leche — producción diaria, por lote y categoría.',
      '• Nacimientos — altas de animales, con lote de destino y categoría.',
      '• Muertes — bajas de hacienda con causa y categoría.',
      '• Traslados — movimientos de animales entre lotes o establecimientos.',
      '• Novedades de Sueldo — novedades para la liquidación de haberes del personal.',
      'Flujo de envío:',
      '• Completá todos los campos requeridos.',
      '• Tocá el botón "Enviar" — se abre un modal para revisar los datos.',
      '• Confirmá: si todo está bien, el formulario se envía a Finnegans y volvés al listado automáticamente.',
      '! Si algún campo falta o tiene un valor inválido, Finnegans devolverá un error con el detalle. Podés corregirlo y reintentar desde el historial.',
    ],
  },
  {
    icon: 'shopping-outline',
    title: 'Pedidos (Compra y Venta)',
    lines: [
      'Desde la pestaña Pedidos podés generar solicitudes de compra de materiales o pedidos de venta a clientes.',
      '• Pedido de Compra — genera una solicitud de compra con ítems y cantidades.',
      '• Pedido de Venta — genera un pedido de venta asociado a un cliente.',
      'Cada tipo de pedido requiere un workflow de Finnegans asignado a tu cuenta.',
      '! Si ves un candado con el texto "Sin workflow asignado", el administrador todavía no habilitó ese tipo de pedido para tu usuario. Contactalo para que lo configure.',
      'Al agregar ítems, podés incluir varios productos en un mismo pedido antes de enviarlo. Al confirmarse el envío, volvés automáticamente al listado de pedidos.',
    ],
  },
  {
    icon: 'account-cash-outline',
    title: 'Novedades de Sueldo',
    lines: [
      'El formulario de Novedades de Sueldo tiene dos campos de búsqueda con comportamiento específico:',
      'TipoNovedadCodigo:',
      '• Si tu espacio de trabajo tiene tipos configurados en Finnegans, aparece un selector con las opciones disponibles.',
      '• Si no hay opciones o hay un error de conexión, aparece un campo de texto libre con un botón "Reintentar".',
      '• En ese caso, ingresá el código del tipo de novedad directamente (consultá con el administrador cuáles aplican).',
      'PersonaCodigo:',
      '• El buscador muestra los empleados en el formato "APELLIDO, NOMBRE · código".',
      '• La búsqueda filtra por inicio de palabra — escribí el inicio del apellido o del nombre para reducir los resultados.',
      '• Si no reconocés el nombre, el código al final identifica unívocamente al empleado en Finnegans.',
      '! Podés agregar múltiples ítems por formulario usando el botón "Agregar item". Cada ítem puede tener un empleado y tipo distinto.',
    ],
  },
  {
    icon: 'clipboard-list-outline',
    title: 'Historial de envíos',
    lines: [
      'El ícono de portapapeles en la esquina superior derecha abre un panel lateral con todos tus envíos.',
      'Cada registro muestra el tipo de formulario, empresa, fecha y estado:',
      '• ENVIADO — procesado correctamente por Finnegans. Sin acción requerida.',
      '• PENDIENTE — sin conexión al momento del envío; se reintentará en automático al recuperar la red.',
      '• ERROR — Finnegans rechazó el envío. El detalle del error aparece en el registro.',
      '! Los registros en ERROR no se reintentan solos — debés corregirlos manualmente. Tocá el registro para editarlo.',
    ],
  },
  {
    icon: 'wifi-off',
    title: 'Uso sin conexión',
    lines: [
      'FSTrack funciona sin internet. Al enviar un formulario sin conexión:',
      '• Los datos se guardan localmente en tu dispositivo con estado PENDIENTE.',
      '• No se pierde ninguna información — podés seguir cargando más formularios.',
      '• En cuanto la app vuelve al primer plano con conexión disponible, reintenta todos los pendientes de forma automática.',
      '! Los formularios sin conexión quedan guardados indefinidamente hasta que se sincronicen. No cerrés la app sin haber verificado que se enviaron.',
    ],
  },
  {
    icon: 'pencil-circle-outline',
    title: 'Corregir y reenviar un error',
    lines: [
      'Si un envío quedó en estado ERROR podés corregirlo sin volver a cargar todo el formulario:',
      '• Abrí el historial de envíos (ícono de portapapeles).',
      '• Tocá el registro en ERROR — se abre el detalle con el mensaje de Finnegans.',
      '• Tocá "Editar y reintentar" para abrir el formulario con los datos ya cargados.',
      '• Modificá los valores incorrectos y tocá "Reintentar".',
      '! Leé el mensaje de error de Finnegans antes de editar — indica exactamente qué campo o valor es inválido.',
    ],
  },
];

const ADMIN_SECTIONS: GuideSection[] = [
  {
    icon: 'lock-open-outline',
    title: 'Acceso al panel de administración',
    lines: [
      'El panel web te permite gestionar toda la configuración de FSTrack sin tocar el servidor directamente.',
      '! URL del panel: https://fisterra.com.ar/admin',
      'Ingresá con tu usuario y contraseña de administrador. La sesión dura 8 horas.',
      'Desde el panel podés: crear dominios, crear cuentas de app, asignar empresas, asignar workflows, gestionar administradores del panel y ver los logs de actividad.',
    ],
  },
  {
    icon: 'shield-account-outline',
    title: 'Administradores del panel',
    lines: [
      'Los administradores del panel son los usuarios que pueden iniciar sesión en /admin. Son independientes de las cuentas de la app.',
      'Desde la sección "Administradores del panel" podés:',
      '• Ver la lista de administradores actuales con su fecha de creación.',
      '• Crear un nuevo administrador ingresando usuario y contraseña.',
      '• Eliminar un administrador existente.',
      '! No es posible eliminar al último administrador — siempre debe quedar al menos uno para poder acceder al panel.',
      'Los campos de contraseña tienen un botón "Ver" para mostrar u ocultar lo que estás escribiendo.',
    ],
  },
  {
    icon: 'domain',
    title: 'Dominios (Workspaces)',
    lines: [
      'Un Dominio representa una organización o cliente. Cada dominio tiene su propio espacio de cuentas y sus credenciales de Finnegans.',
      'Cuando un usuario ingresa a la app, el campo "Dominio" debe coincidir exactamente con el Workspace Code del dominio al que pertenece.',
      'Campos requeridos para crear un dominio:',
      '• Nombre — etiqueta descriptiva para uso interno del panel (ej: "Estancia La Paz").',
      '• Workspace Code — código corto en minúsculas que los usuarios escriben al loguearse (ej: "lapaz").',
      '• Finnegans Client ID — credencial OAuth provista por el equipo de Finnegans para este cliente.',
      '• Finnegans Client Secret — par del Client ID; se usa para obtener tokens en cada envío a la API.',
      '! El Workspace Code no puede repetirse entre dominios y no se puede cambiar después de crearlo. Elegilo con cuidado.',
    ],
  },
  {
    icon: 'account-plus-outline',
    title: 'Cuentas de usuario',
    lines: [
      'Cada cuenta pertenece a un dominio y representa a un usuario de campo. Los usuarios se loguean con su nombre de cuenta, contraseña y el dominio que les corresponde.',
      'Campos requeridos para crear una cuenta:',
      '• Nombre de usuario — único dentro del dominio (ej: "jlopez").',
      '• Contraseña — se almacena encriptada con bcrypt. El panel no permite verla, solo reasignarla.',
      '• Nombre completo — nombre visible en los logs de actividad (ej: "José López").',
      '• Rol — "user" para uso normal; "admin" reservado para futuros permisos elevados.',
      '• Dominio — a qué organización pertenece esta cuenta.',
      '! Alternativa para entornos de servidor: ejecutar node create-user.js desde la raíz del backend. Útil para el primer usuario de un dominio nuevo.',
    ],
  },
  {
    icon: 'office-building-cog',
    title: 'Restricción de empresas por cuenta',
    lines: [
      'Por defecto, un usuario puede ver todas las empresas activas de Finnegans asociadas a su dominio en el selector de Home.',
      'Si necesitás que un usuario solo vea ciertos establecimientos:',
      '• En el panel, seleccioná el dominio y luego la cuenta.',
      '• En la sección "Empresas", marcá las empresas que querés habilitarle.',
      '• Guardá los cambios — a partir de entonces ese usuario solo verá esas empresas.',
      '! Si dejás la lista de empresas vacía (sin ninguna tildada), el usuario vuelve a ver todas las empresas del dominio sin restricción.',
      'Las empresas disponibles para asignar se obtienen de Finnegans en tiempo real usando las credenciales del dominio.',
    ],
  },
  {
    icon: 'cog-transfer-outline',
    title: 'Workflows de pedidos',
    lines: [
      'Los Pedidos de Compra y Venta requieren un Workflow de Finnegans. Sin él, esa opción aparece bloqueada con candado en la app del usuario.',
      'Los workflows se asignan por cuenta (no por dominio): cada usuario puede tener habilitados distintos tipos de pedido.',
      'Cómo asignar un workflow:',
      '• En el panel, seleccioná dominio → cuenta → sección "Workflows".',
      '• Elegí el workflow de Compra y/o el de Venta desde los desplegables (se cargan desde Finnegans).',
      '• Guardá. Los cambios se reflejan en la app la próxima vez que el usuario abre la pestaña Pedidos.',
      '! Podés asignar solo Compra, solo Venta, ambos o ninguno de forma independiente. Si un usuario no necesita pedidos, no asignés ningún workflow.',
      '! Si el panel muestra error al cargar workflows, es posible que la API de workflows no esté habilitada para ese espacio de trabajo en Finnegans. Consultá con el equipo de Finnegans.',
    ],
  },
  {
    icon: 'text-box-search-outline',
    title: 'Registro de actividad (Logs)',
    lines: [
      'El panel muestra los últimos 200 envíos de todos los usuarios de todos los dominios, ordenados del más reciente al más antiguo.',
      'Cada registro incluye:',
      '• Usuario y dominio que realizó el envío.',
      '• Tipo de formulario, empresa, lote, categoría y cantidad (cuando aplica).',
      '• Estado: SUCCESS (procesado por Finnegans) o ERROR (rechazado con el mensaje de la API).',
      '• Fecha y hora del intento.',
      '! Para ver los envíos desde la app (incluyendo PENDIENTE), el usuario puede tocar el ícono de portapapeles — muestra sus últimos 100 envíos.',
    ],
  },
];

// El sistema define un solo color saturado —el rojo, reservado a titulares e
// isotipo—, así que las dos guías se distinguen con el navy institucional y el
// ocre semántico en vez del índigo y el ámbar del template.
const USER_ACCENT = Palette.navy;
const ADMIN_ACCENT = Semantic.pending;

function renderLines(lines: string[], accent: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    result.push(
      <View
        key={key}
        style={[s.bulletBlock, { borderLeftColor: accent }]}
      >
        {bulletBuffer.map((b, i) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.dot, { backgroundColor: accent }]} />
            <Text style={s.bulletText}>{b}</Text>
          </View>
        ))}
      </View>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith('• ')) {
      bulletBuffer.push(line.slice(2));
      return;
    }

    flushBullets(`bullets-${i}`);

    if (line.startsWith('! ')) {
      result.push(
        <View
          key={i}
          style={[
            s.highlight,
            { backgroundColor: `${accent}12`, borderColor: `${accent}30` },
          ]}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={15}
            color={accent}
            style={{ marginTop: 1 }}
          />
          <Text style={s.highlightText}>{line.slice(2)}</Text>
        </View>
      );
      return;
    }

    if (line.endsWith(':')) {
      result.push(
        <Text key={i} style={[s.subLabel, { color: accent }]}>
          {line}
        </Text>
      );
      return;
    }

    result.push(
      <Text key={i} style={s.paragraph}>
        {line}
      </Text>
    );
  });

  flushBullets(`bullets-end`);
  return result;
}

function AccordionSection({
  section,
  accent,
}: {
  section: GuideSection;
  accent: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={s.card}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [s.cardHeader, pressed && s.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={[s.iconBox, { backgroundColor: `${accent}18` }]}>
          <MaterialCommunityIcons
            name={section.icon as any}
            size={20}
            color={accent}
          />
        </View>
        <Text style={s.cardTitle}>{section.title}</Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Palette.steelDeep}
        />
      </Pressable>

      {open && (
        <View style={[s.cardBody, { backgroundColor: `${accent}05` }]}>
          {renderLines(section.lines, accent)}
        </View>
      )}
    </View>
  );
}

export default function AyudaScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<'usuario' | 'admin'>('usuario');

  const sections = tab === 'usuario' ? USER_SECTIONS : ADMIN_SECTIONS;
  const accent = tab === 'usuario' ? USER_ACCENT : ADMIN_ACCENT;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        <Panel style={s.hero}>
          <PairedHeading line1="GUÍA" line2="de uso" size="sm" />
          <Text style={s.pageSubtitle}>
            {tab === 'usuario'
              ? 'Instrucciones para el uso diario de la app.'
              : 'Gestión de dominios, cuentas y configuraciones.'}
          </Text>
        </Panel>

        {isAdmin && (
          <View style={s.segmented}>
            {(['usuario', 'admin'] as const).map((key) => {
              const active = tab === key;
              const ac = key === 'usuario' ? USER_ACCENT : ADMIN_ACCENT;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  style={[s.segment, active && s.segmentActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <MaterialCommunityIcons
                    name={key === 'usuario' ? 'account-outline' : 'shield-account-outline'}
                    size={16}
                    color={active ? ac : Palette.steelText}
                  />
                  <Text
                    style={[s.segmentText, active && { color: ac, fontFamily: FontFamily.bold }]}
                  >
                    {key === 'usuario' ? 'Usuario' : 'Admin'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={s.list}>
          {sections.map((section) => (
            <AccordionSection
              key={section.title}
              section={section}
              accent={accent}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.lg,
  },
  hero: { gap: Spacing.sm },
  pageSubtitle: {
    ...Type.label,
    color: Palette.steelText,
  },

  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 47, 67, 0.06)',
    borderRadius: Radius.field,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentActive: {
    backgroundColor: Palette.surfaceHigh,
    borderWidth: 1,
    borderColor: Effects.hairline,
    ...Effects.panelShadow,
  },
  segmentText: {
    ...Type.label,
    fontFamily: FontFamily.medium,
    color: Palette.steelText,
  },

  list: { gap: Spacing.md },
  card: {
    backgroundColor: Palette.surfaceHigh,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Effects.hairline,
    overflow: 'hidden',
    ...Effects.panelShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pressed: { opacity: 0.75 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    ...Type.body,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
  },
  cardBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Effects.hairline,
  },

  paragraph: {
    ...Type.body,
    lineHeight: 23,
    color: Palette.ink,
  },
  subLabel: {
    ...Type.caption,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.4,
    marginTop: 2,
    marginBottom: -2,
  },

  bulletBlock: {
    borderLeftWidth: 3,
    borderRadius: 2,
    paddingLeft: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.sm,
    marginVertical: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    ...Type.label,
    lineHeight: 21,
    color: Palette.ink,
  },

  highlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.field,
    borderWidth: 1,
    marginVertical: 2,
  },
  highlightText: {
    flex: 1,
    ...Type.label,
    lineHeight: 20,
    color: Palette.ink,
  },
});
