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
