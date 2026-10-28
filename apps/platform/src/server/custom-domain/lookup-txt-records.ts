import 'server-only';

import { HTTP_STATUS } from '@blog/config';
import { CUSTOM_DOMAIN_TXT_TYPE } from '@platform/constants/custom-domain';
import { DNS_RCODE, DNS_TYPE } from '@platform/constants/dns';
import { z } from 'zod';

const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';
const DOH_ACCEPT = 'application/dns-json';
const DOH_TIMEOUT_MS = 5000;
const QUOTED_STRING = /"((?:[^"\\]|\\.)*)"/g;

const dohResponseSchema = z.object({
  Status: z.number(),
  Answer: z.array(z.object({ type: z.number(), data: z.string() })).optional(),
});

const unquoteTxtData = (data: string) =>
  Array.from(data.matchAll(QUOTED_STRING), ([, text = '']) =>
    text.replace(/\\(.)/g, '$1'),
  ).join('');

export const lookupTxtRecords = async (name: string): Promise<string[]> => {
  const url = new URL(DOH_ENDPOINT);
  url.searchParams.set('name', name);
  url.searchParams.set('type', CUSTOM_DOMAIN_TXT_TYPE);

  const response = await fetch(url, {
    headers: { accept: DOH_ACCEPT },
    signal: AbortSignal.timeout(DOH_TIMEOUT_MS),
    cache: 'no-store',
  });
  if (response.status !== HTTP_STATUS.OK) {
    throw new Error(`DNS lookup answered ${response.status}`);
  }

  const { Status, Answer = [] } = dohResponseSchema.parse(
    await response.json(),
  );
  if (Status === DNS_RCODE.NXDOMAIN) return [];
  if (Status !== DNS_RCODE.NO_ERROR) {
    throw new Error(`DNS lookup failed with code ${Status}`);
  }

  return Answer.filter(({ type }) => type === DNS_TYPE.TXT).map(({ data }) =>
    unquoteTxtData(data),
  );
};
