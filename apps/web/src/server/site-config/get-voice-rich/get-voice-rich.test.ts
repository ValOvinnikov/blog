import { LOCALE_ISO_CODES, type TVoicePortableText } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { VOICE_RICH_FETCH_FAILED_EVENT } from '@web/constants/site-config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getVoiceRich } from './get-voice-rich';

const { getSiteConfigMock, getMessagesMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
  getMessagesMock: vi.fn(),
}));

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: getSiteConfigMock,
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('next-intl/server', () => ({
  getMessages: getMessagesMock,
}));

const FIELD_ID = 'blogListEmpty';
const FETCH_ERROR = 'site config unavailable';
const CATALOG_EMPTY = 'No posts yet.';
const OVERRIDE_EMPTY = 'Nothing published yet.';

const BASE_MESSAGES = {
  blogListPage: { empty: CATALOG_EMPTY },
};

const richTextOf = (text: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: 'a',
    style: 'normal',
    children: [{ _type: 'span', _key: 'a1', text }],
  },
];

describe(getVoiceRich, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
    getMessagesMock.mockReset();
    getMessagesMock.mockResolvedValue(BASE_MESSAGES);
    getSiteConfigMock.mockResolvedValue(
      okResult({ voiceOverridesByLocale: {} }),
    );
  });

  it('returns the stored override for the given field id', async () => {
    const override = richTextOf(OVERRIDE_EMPTY);
    getSiteConfigMock.mockResolvedValue(
      okResult({
        voiceOverridesByLocale: {
          [MOCK_REQUEST_CONTEXT.locale]: { blogListEmpty: override },
        },
      }),
    );

    const result = await getVoiceRich(FIELD_ID);

    expect(result).toBe(override);
  });

  it('falls back to the catalog default wrapped as one paragraph when there is no override', async () => {
    const result = await getVoiceRich(FIELD_ID);

    expect(result[0]?.children[0]?.text).toBe(CATALOG_EMPTY);
  });

  it('falls back to the catalog default and logs when the site config fetch fails', async () => {
    getSiteConfigMock.mockResolvedValue(errorResult(FETCH_ERROR));

    const result = await getVoiceRich(FIELD_ID);

    expect(result[0]?.children[0]?.text).toBe(CATALOG_EMPTY);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      VOICE_RICH_FETCH_FAILED_EVENT,
      { id: FIELD_ID, error: FETCH_ERROR },
    );
  });

  it("returns the request language's override in a non-default language", async () => {
    const override = richTextOf('Noch keine Beiträge.');
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.DE,
    });
    getSiteConfigMock.mockResolvedValue(
      okResult({
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            blogListEmpty: richTextOf(OVERRIDE_EMPTY),
          },
          [LOCALE_ISO_CODES.DE]: { blogListEmpty: override },
        },
      }),
    );

    const result = await getVoiceRich(FIELD_ID);

    expect(result).toBe(override);
  });

  it('returns the catalog default in a language with no override of its own', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.DE,
    });
    getSiteConfigMock.mockResolvedValue(
      okResult({
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            blogListEmpty: richTextOf(OVERRIDE_EMPTY),
          },
        },
      }),
    );

    const result = await getVoiceRich(FIELD_ID);

    expect(result[0]?.children[0]?.text).toBe(CATALOG_EMPTY);
  });

  it("reads the site config of the request context's tenant", async () => {
    await getVoiceRich(FIELD_ID);

    expect(getSiteConfigMock).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
    );
  });

  it('reads no tenant from the request headers when the route resolved no tenant', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await getVoiceRich(FIELD_ID);

    expect(getSiteConfigMock).toHaveBeenCalledWith(
      UNRESOLVED_TENANT_PLACEHOLDER,
    );
  });
});
