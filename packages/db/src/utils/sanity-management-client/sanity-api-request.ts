export const SANITY_MANAGEMENT_API_BASE = 'https://api.sanity.io/v2021-06-07';

const SANITY_ACCESS_API_BASE = 'https://api.sanity.io/v2026-07-10';

export const SANITY_API_TIMEOUT_MS = 30_000;

type TSanityApiSurface = 'Management' | 'Access';

const API_BASE: Record<TSanityApiSurface, string> = {
  Management: SANITY_MANAGEMENT_API_BASE,
  Access: SANITY_ACCESS_API_BASE,
};

async function sanityApiRequest<T>(
  surface: TSanityApiSurface,
  path: string,
  token: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE[surface]}${path}`, {
    ...init,
    signal: AbortSignal.timeout(SANITY_API_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Sanity ${surface} API ${init.method ?? 'GET'} ${path} failed: ${response.status} ${body}`,
    );
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function sanityManagementRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  return sanityApiRequest<T>('Management', path, token, init);
}

export function sanityAccessRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  return sanityApiRequest<T>('Access', path, token, init);
}
