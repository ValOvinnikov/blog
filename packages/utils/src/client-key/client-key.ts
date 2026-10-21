// Vercel overwrites `x-forwarded-for` on every request it proxies, so a browser cannot spoof it there:
// https://vercel.com/docs/edge-network/headers/request-headers#x-forwarded-for
export const UNKNOWN_CLIENT_KEY = 'unknown';

export const resolveClientKey = (headers: Headers): string => {
  const first = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (first) return first;

  return headers.get('x-real-ip') ?? UNKNOWN_CLIENT_KEY;
};
