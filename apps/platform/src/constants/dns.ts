export const DNS_TYPE = {
  CNAME: 5,
  TXT: 16,
} as const;

export const DNS_RCODE = {
  NO_ERROR: 0,
  SERVFAIL: 2,
  NXDOMAIN: 3,
} as const;
