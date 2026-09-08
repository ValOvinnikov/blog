import type { TVoicePortableText } from '@blog/config';

import { getVoiceRich } from './get-voice-rich';

const { getSiteConfigMock, getMessagesMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
  getMessagesMock: vi.fn(),
}));

vi.mock('./get-site-config', () => ({
  getSiteConfig: getSiteConfigMock,
}));

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
  });

  it('returns the stored override for the given field id', async () => {
    const override = richTextOf('Nothing published yet.');
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: { voiceOverrides: { blogListEmpty: override } },
    });

    const result = await getVoiceRich('blogListEmpty');

    expect(result).toBe(override);
  });

  it('falls back to the catalog default wrapped as one paragraph when there is no override', async () => {
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: { voiceOverrides: {} },
    });

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

  it('forwards an explicitly supplied tenant to getSiteConfig', async () => {
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: { voiceOverrides: {} },
    });

    await getVoiceRich('blogListEmpty', 'tenant-2');

    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-2');
  });
});
