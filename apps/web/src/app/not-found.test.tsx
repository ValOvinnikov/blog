import { LOCALE_ISO_CODES } from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { NextIntlClientProvider } from 'next-intl';

import NotFound, { generateMetadata } from './not-found';

const { getMessagesMock, getTranslationsMock, setRequestLocaleMock } =
  vi.hoisted(() => ({
    getMessagesMock: vi.fn(),
    getTranslationsMock: vi.fn(),
    setRequestLocaleMock: vi.fn(),
  }));

vi.mock('next-intl/server', () => ({
  getMessages: getMessagesMock,
  getTranslations: getTranslationsMock,
  setRequestLocale: setRequestLocaleMock,
}));

const messages = { notFound: { commandNotFound: 'command not found' } };
const t = Object.assign((key: string) => `translated:${key}`, {
  rich: vi.fn(),
  markup: vi.fn(),
  raw: vi.fn(),
});

describe('NotFound (root not-found route)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMessagesMock.mockResolvedValue(messages);
    getTranslationsMock.mockResolvedValue(t);
  });

  describe('generateMetadata', () => {
    it('pins the request locale before reading translations', async () => {
      await generateMetadata();

      expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
      expect(setRequestLocaleMock.mock.invocationCallOrder[0]).toBeLessThan(
        getTranslationsMock.mock.invocationCallOrder[0]!,
      );
    });

    it('builds title and description from the notFound namespace', async () => {
      const metadata = await generateMetadata();

      expect(metadata).toEqual({
        title: 'translated:metaTitle',
        description: 'translated:metaDescription',
      });
    });
  });

  it('pins the request locale before rendering', async () => {
    await NotFound();

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(setRequestLocaleMock.mock.invocationCallOrder[0]).toBeLessThan(
      getMessagesMock.mock.invocationCallOrder[0]!,
    );
  });

  it('wraps NotFoundPage in its own NextIntlClientProvider, independent of any ancestor provider', async () => {
    const ui = await NotFound();

    expect(ui.type).toBe(NextIntlClientProvider);
    expect(ui.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(ui.props.messages).toBe(messages);
    expect(ui.props.children.type).toBe(NotFoundPage);
  });
});
