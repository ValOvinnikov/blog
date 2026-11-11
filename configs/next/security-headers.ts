export type TSecurityHeader = { key: string; value: string };

export const buildFramingHeaders = (
  contentSecurityPolicy: string,
): TSecurityHeader[] => [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];
