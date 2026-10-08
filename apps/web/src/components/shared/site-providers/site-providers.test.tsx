import {
  LOCALE_ISO_CODES,
  SITE_MESSAGES as realMessages,
  SITE_MESSAGES_BY_LOCALE,
} from '@blog/config';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { getRequestContext } from '@web/server/request-context/request-context';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';

import { SiteProviders } from './site-providers';

type TAnyElement = ReactElement<Record<string, unknown>>;

const { getNowMock, getTimeZoneMock } = vi.hoisted(() => ({
  getNowMock: vi.fn(),
  getTimeZoneMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({ isCapabilityEnabled: vi.fn().mockResolvedValue(false) }),
);

vi.mock('@web/utils/resolve-tenant-messages', () => ({
  resolveTenantMessages: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  getSanityImageBaseUrl: () => 'https://cdn.sanity.io/images/p/d/',
}));

vi.mock('next-intl/server', () => ({
  getNow: getNowMock,
  getTimeZone: getTimeZoneMock,
}));

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: unknown }) => children,
}));

const getRequestContextMock = vi.mocked(getRequestContext);
const resolveTenantMessagesMock = vi.mocked(resolveTenantMessages);

const now = new Date('2026-07-21T00:00:00.000Z');

const childOf = (node: TAnyElement): TAnyElement =>
  node.props.children as TAnyElement;

const render = async (): Promise<{
  intl: TAnyElement;
  voiceRich: TAnyElement;
}> => {
  const root = (await SiteProviders({
    children: <div>content</div>,
  })) as TAnyElement;
  const intl = childOf(root);
  const voiceRich = childOf(childOf(childOf(intl)));
  return { intl, voiceRich };
};

describe(SiteProviders, () => {
  beforeEach(() => {
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getNowMock.mockResolvedValue(now);
    getTimeZoneMock.mockResolvedValue('UTC');
    resolveTenantMessagesMock.mockImplementation((messages) =>
      Promise.resolve({ messages, rich: {} } as never),
    );
  });

  it('passes the messages, locale, now, and timeZone explicitly to NextIntlClientProvider', async () => {
    const { intl } = await render();

    expect(intl.type).toBe(NextIntlClientProvider);
    expect(intl.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(intl.props.messages).toBe(realMessages);
    expect(intl.props.now).toBe(now);
    expect(intl.props.timeZone).toBe('UTC');
  });

  it('applies the tenant voice pack to the base messages for the default language', async () => {
    const tenantMessages = { ...realMessages };
    resolveTenantMessagesMock.mockResolvedValue({
      messages: tenantMessages,
      rich: {},
    } as never);

    const { intl } = await render();

    expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
      realMessages,
      DEFAULT_REQUEST_CONTEXT.tenantId,
    );
    expect(intl.props.messages).toBe(tenantMessages);
  });

  it("serves another language's messages without the tenant's default-language voice pack", async () => {
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });

    const { intl } = await render();

    expect(resolveTenantMessagesMock).not.toHaveBeenCalled();
    expect(intl.props.messages).toBe(SITE_MESSAGES_BY_LOCALE.NL);
  });

  it('mounts VoiceRichProvider with the rich voice values from resolveTenantMessages', async () => {
    const rich = { blogListEmpty: [{ _type: 'block' }] };
    resolveTenantMessagesMock.mockResolvedValue({
      messages: realMessages,
      rich,
    } as never);

    const { voiceRich } = await render();

    expect(voiceRich.type).toBe(VoiceRichProvider);
    expect(voiceRich.props.values).toBe(rich);
  });
});
