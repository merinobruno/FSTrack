const STATUS_MESSAGES: Record<number, string> = {
  400: 'Los datos enviados son inválidos.',
  401: 'Token inválido o expirado.',
  403: 'No tenés permiso para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'Ya existe un registro con esos datos.',
  422: 'Los datos no pudieron procesarse. Revisá los campos.',
  429: 'Demasiadas solicitudes. Esperá unos segundos e intentá de nuevo.',
  500: 'Error interno del servidor. Intentá más tarde.',
  502: 'El servidor no está disponible. Intentá más tarde.',
  503: 'Servicio no disponible temporalmente.',
};

function extractApiMessage(parsed: any): string | null {
  if (typeof parsed === 'string') {
    const t = parsed.trim();
    return t.length > 0 && t.length < 300 ? t : null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  for (const key of ['mensaje', 'message', 'error', 'descripcion', 'description', 'detail', 'detalle']) {
    const v = parsed[key];
    if (typeof v === 'string' && v.trim().length > 0 && v.trim().length < 300) {
      return v.trim();
    }
  }

  if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
    const first = parsed.errors[0];
    if (typeof first === 'string') return first;
    for (const key of ['message', 'mensaje', 'description']) {
      if (typeof first?.[key] === 'string') return first[key];
    }
  }

  return null;
}

export type ApiError = {
  title: string;
  detail?: string;
};

export function getFriendlyError(status: number, parsed: any): ApiError {
  const title = STATUS_MESSAGES[status] ?? `Error inesperado (código ${status}).`;
  const detail = extractApiMessage(parsed) ?? undefined;
  return { title, detail };
}

export const NETWORK_ERROR: ApiError = {
  title: 'No se pudo conectar al servidor.',
  detail: 'Verificá tu conexión a internet e intentá de nuevo.',
};

export const TOKEN_ERROR: ApiError = {
  title: 'No se pudo autenticar con el servicio.',
  detail: 'El servidor de autenticación no respondió. Intentá más tarde.',
};

export const TIMEOUT_ERROR: ApiError = {
  title: 'El servidor tardó demasiado en responder.',
  detail: 'Puede estar iniciándose. Esperá unos segundos e intentá de nuevo.',
};

/**
 * Fallo de red en el ingreso.
 *
 * Distinto de `NETWORK_ERROR`: desde el cliente no hay forma de separar "no
 * hay internet" de "el servidor no está escuchando" —en los dos casos `fetch`
 * tira sin respuesta—, así que el texto nombra las dos posibilidades en lugar
 * de culpar solo a la conexión. Lo importante es que descarte las
 * credenciales, que es lo que el usuario no puede deducir solo.
 */
export const LOGIN_NETWORK_ERROR: ApiError = {
  title: 'No se pudo contactar al servidor.',
  detail: 'No es un problema con tus credenciales: puede ser tu conexión o que el servidor esté caído.',
};

/**
 * Errores de la pantalla de ingreso.
 *
 * Se separa del mapeo genérico por dos motivos. Uno, los textos generales no
 * sirven acá: un 401 en cualquier otra pantalla es "token expirado", pero en
 * el login es una credencial equivocada. Dos, y sobre todo, el usuario tiene
 * que poder distinguir si falló por lo que escribió o porque el servidor no
 * está — por eso los mensajes de servidor lo dicen explícitamente.
 *
 * El `error` que devuelve el backend queda deliberadamente afuera: viene en
 * inglés ("Invalid credentials") y se estaba mostrando tal cual.
 */
export function getLoginError(status: number): ApiError {
  if (status === 400) {
    return {
      title: 'Faltan datos.',
      detail: 'Completá espacio de trabajo, cuenta y contraseña.',
    };
  }

  if (status === 401) {
    return {
      title: 'Usuario o contraseña incorrectos.',
      detail: 'Revisá también el espacio de trabajo: si no coincide, el ingreso falla igual.',
    };
  }

  if (status === 403) {
    return {
      title: 'Tu cuenta está desactivada.',
      detail: 'Las credenciales son correctas. Contactá al administrador para reactivarla.',
    };
  }

  if (status >= 500) {
    return {
      title: 'El servidor no está disponible.',
      detail: 'No es un problema con tus credenciales. Intentá de nuevo en unos minutos.',
    };
  }

  return getFriendlyError(status, null);
}
