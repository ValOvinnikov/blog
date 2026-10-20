import { SANITY_API_SURFACE, type TSanityApiSurface } from '@blog/config';

const SANITY_MANAGEMENT_API_BASE = 'https://api.sanity.io/v2021-06-07';

const SANITY_ACCESS_API_BASE = 'https://api.sanity.io/v2026-07-10';

export const SANITY_API_TIMEOUT_MS = 30_000;

const API_BASE: Record<TSanityApiSurface, string> = {
  [SANITY_API_SURFACE.MANAGEMENT]: SANITY_MANAGEMENT_API_BASE,
  [SANITY_API_SURFACE.ACCESS]: SANITY_ACCESS_API_BASE,
};

const API_SURFACE_LABEL: Record<TSanityApiSurface, string> = {
  [SANITY_API_SURFACE.MANAGEMENT]: 'Management',
  [SANITY_API_SURFACE.ACCESS]: 'Access',
};

export function sanityApiError(
  surface: TSanityApiSurface,
  method: string,
  path: string,
  response: Response,
  body: string,
): Error {
  return new Error(
    `Sanity ${API_SURFACE_LABEL[surface]} API ${method} ${path} failed: ${response.status} ${body}`,
  );
}

async function sanityApiResponse(
  surface: TSanityApiSurface,
  path: string,
  token: string,
  init: RequestInit,
  allowStatus: readonly number[],
): Promise<Response> {
  const response = await fetch(`${API_BASE[surface]}${path}`, {
    ...init,
    signal: AbortSignal.timeout(SANITY_API_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok && !allowStatus.includes(response.status)) {
    const body = await response.text().catch(() => '');
    throw sanityApiError(surface, init.method ?? 'GET', path, response, body);
  }

  return response;
}

async function sanityApiRequest<T>(
  surface: TSanityApiSurface,
  path: string,
  token: string,
  init: RequestInit,
): Promise<T> {
  const response = await sanityApiResponse(surface, path, token, init, []);
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function sanityManagementResponse(
  path: string,
  token: string,
  init: RequestInit,
  allowStatus: readonly number[],
): Promise<Response> {
  return sanityApiResponse(
    SANITY_API_SURFACE.MANAGEMENT,
    path,
    token,
    init,
    allowStatus,
  );
}

export function sanityManagementRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  return sanityApiRequest<T>(SANITY_API_SURFACE.MANAGEMENT, path, token, init);
}

export function sanityAccessRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  return sanityApiRequest<T>(SANITY_API_SURFACE.ACCESS, path, token, init);
}
