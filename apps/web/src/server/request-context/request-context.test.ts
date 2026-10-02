import { LOCALE_ISO_CODES } from '@blog/config';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/unresolved-tenant-placeholder';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

const params = (tenant: string, locale: string) =>
  Promise.resolve({ tenant, locale });

const loadRequestContext = async () => {
  vi.doMock('react', withMemoizingReactCache);
  vi.resetModules();
  return import('./request-context');
};

describe('request-context', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('serves the tenant and locale it was entered with', async () => {
    const { enterRequestContext, getContextTenantId, getContextLocale } =
      await loadRequestContext();

    await enterRequestContext(params('tenant-1', LOCALE_ISO_CODES.NL));

    expect(getContextTenantId()).toBe('tenant-1');
    expect(getContextLocale()).toBe(LOCALE_ISO_CODES.NL);
  });

  it('sets the next-intl request locale', async () => {
    const { enterRequestContext } = await loadRequestContext();

    await enterRequestContext(params('tenant-1', LOCALE_ISO_CODES.NL));

    expect(vi.mocked(setRequestLocale)).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.NL,
    );
  });

  it('stores the unresolved-tenant placeholder as no tenant', async () => {
    const { enterRequestContext, getContextTenantId } =
      await loadRequestContext();

    await enterRequestContext(
      params(UNRESOLVED_TENANT_PLACEHOLDER, LOCALE_ISO_CODES.EN),
    );

    expect(getContextTenantId()).toBeUndefined();
  });

  it('throws a 404 for a locale the site does not serve, after storing the tenant', async () => {
    const { enterRequestContext, peekContextTenantId } =
      await loadRequestContext();

    await expect(enterRequestContext(params('tenant-1', 'xx'))).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(vi.mocked(notFound)).toHaveBeenCalled();
    expect(peekContextTenantId()).toBe('tenant-1');
  });

  it('can be entered again with the same params', async () => {
    const { enterRequestContext, getContextTenantId, getContextLocale } =
      await loadRequestContext();

    await enterRequestContext(params('tenant-1', LOCALE_ISO_CODES.EN));
    await enterRequestContext(params('tenant-1', LOCALE_ISO_CODES.EN));

    expect(getContextTenantId()).toBe('tenant-1');
    expect(getContextLocale()).toBe(LOCALE_ISO_CODES.EN);
  });

  it('refuses a second entry for a different tenant', async () => {
    const { enterRequestContext } = await loadRequestContext();

    await enterRequestContext(params('tenant-1', LOCALE_ISO_CODES.EN));

    await expect(
      enterRequestContext(params('tenant-2', LOCALE_ISO_CODES.EN)),
    ).rejects.toThrow(/different route params/);
  });

  it('refuses a second entry for a tenant after one entered as unresolved', async () => {
    const { enterRequestContext } = await loadRequestContext();

    await enterRequestContext(
      params(UNRESOLVED_TENANT_PLACEHOLDER, LOCALE_ISO_CODES.EN),
    );

    await expect(
      enterRequestContext(params('tenant-1', LOCALE_ISO_CODES.EN)),
    ).rejects.toThrow(/different route params/);
  });

  it('refuses a second entry for a different locale', async () => {
    const { enterRequestContext } = await loadRequestContext();

    await enterRequestContext(params('tenant-1', LOCALE_ISO_CODES.EN));

    await expect(
      enterRequestContext(params('tenant-1', LOCALE_ISO_CODES.NL)),
    ).rejects.toThrow(/different route params/);
  });

  it('throws naming enterRequestContext when the tenant is read before entry', async () => {
    const { getContextTenantId } = await loadRequestContext();

    expect(() => getContextTenantId()).toThrow(/enterRequestContext\(\)/);
  });

  it('throws naming enterRequestContext when the locale is read before entry', async () => {
    const { getContextLocale } = await loadRequestContext();

    expect(() => getContextLocale()).toThrow(/enterRequestContext\(\)/);
  });

  it('peeks no tenant before entry instead of throwing', async () => {
    const { peekContextTenantId } = await loadRequestContext();

    expect(peekContextTenantId()).toBeUndefined();
  });
});
