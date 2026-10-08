import { LOCALE_ISO_CODES, type TVoicePortableText } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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

const BASE_MESSAGES = {
  blogListPage: { empty: 'No posts yet.' },
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
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: { voiceOverridesByLocale: {} },
    });
  });

  it('returns the stored override for the given field id', async () => {
    const override = richTextOf('Nothing published yet.');
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: {
        voiceOverridesByLocale: {
          [DEFAULT_REQUEST_CONTEXT.locale]: { blogListEmpty: override },
        },
      },
    });

    const result = await getVoiceRich('blogListEmpty');

    expect(result).toBe(override);
  });

  it('falls back to the catalog default wrapped as one paragraph when there is no override', async () => {
    const result = await getVoiceRich('blogListEmpty');

    expect(result[0]?.children[0]?.text).toBe('No posts yet.');
  });

  it('falls back to the catalog default and logs when the site config fetch fails', async () => {
    getSiteConfigMock.mockResolvedValue({ ok: false, error: 'boom' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getVoiceRich('blogListEmpty');

    expect(result[0]?.children[0]?.text).toBe('No posts yet.');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("returns the request language's override in a non-default language", async () => {
    const override = richTextOf('Noch keine Beiträge.');
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.DE,
    });
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: {
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            blogListEmpty: richTextOf('Nothing published yet.'),
          },
          [LOCALE_ISO_CODES.DE]: { blogListEmpty: override },
        },
      },
    });

    const result = await getVoiceRich('blogListEmpty');

    expect(result).toBe(override);
  });

  it('returns the catalog default in a language with no override of its own', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.DE,
    });
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: {
        voiceOverridesByLocale: {
          [LOCALE_ISO_CODES.EN]: {
            blogListEmpty: richTextOf('Nothing published yet.'),
          },
        },
      },
    });

    const result = await getVoiceRich('blogListEmpty');

    expect(result[0]?.children[0]?.text).toBe('No posts yet.');
  });

  it('forwards an explicitly supplied tenant to getSiteConfig', async () => {
    await getVoiceRich('blogListEmpty', 'tenant-2');

    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-2');
  });
});
