import realMessages from '@admin/i18n/messages/en.json';
import { customRenderAsync } from '@admin/testing/custom-render';
import { LOCALE_ISO_CODES } from '@blog/config';
import { notFound } from 'next/navigation';

import LocaleLayout, { generateStaticParams } from './layout';

const { getMessagesMock, setRequestLocaleMock } = vi.hoisted(() => ({
  getMessagesMock: vi.fn(),
  setRequestLocaleMock: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getMessages: getMessagesMock,
  setRequestLocale: setRequestLocaleMock,
}));

const setup = customRenderAsync(LocaleLayout, {
  children: <div>content</div>,
  params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
});

describe('LocaleLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMessagesMock.mockResolvedValue(realMessages);
  });

  describe('generateStaticParams', () => {
    it('returns params for every supported locale', () => {
      expect(generateStaticParams()).toEqual([{ locale: LOCALE_ISO_CODES.EN }]);
    });
  });

  it('404s on an unsupported locale without ever pinning it', async () => {
    await expect(
      LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({ locale: 'FR' as typeof LOCALE_ISO_CODES.EN }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalledTimes(1);
    expect(setRequestLocaleMock).not.toHaveBeenCalled();
  });

  it('passes real messages and the resolved locale to NextIntlClientProvider', async () => {
    const ui = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
    });

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(ui.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(ui.props.messages).toBe(realMessages);
  });

  it('renders children', async () => {
    const { getByText } = await setup();

    expect(getByText('content')).toBeVisible();
  });
});
