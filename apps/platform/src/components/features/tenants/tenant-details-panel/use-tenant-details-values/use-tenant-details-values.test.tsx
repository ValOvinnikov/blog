import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { act, renderHook } from '@platform/testing/custom-render';
import {
  mockClientTenant,
  MOCK_NEW_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_RENAMED_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';

import { useTenantDetailsValues } from './use-tenant-details-values';

faker.seed(5792);

const MOCK_UNSAVED_DOMAIN = faker.internet.domainName();
const DEFAULT_TENANT = mockClientTenant();

const renderValues = () =>
  renderHook(
    ({ tenant, ownerEmail }) => useTenantDetailsValues(tenant, ownerEmail),
    {
      initialProps: { tenant: DEFAULT_TENANT, ownerEmail: MOCK_OWNER_EMAIL },
    },
  );

describe(useTenantDetailsValues, () => {
  it('starts from the tenant and owner email with nothing changed', () => {
    const { result } = renderValues();

    expect(result.current.values).toEqual({
      name: MOCK_TENANT_NAME,
      primaryDomain: MOCK_TENANT_DOMAIN,
      plan: DEFAULT_TENANT.plan,
      locale: DEFAULT_TENANT.locale,
      ownerEmail: MOCK_OWNER_EMAIL,
    });
    expect(result.current.changedFieldKeys).toEqual([]);
  });

  it('starts with an empty owner email when the tenant has no owner', () => {
    const { result } = renderHook(() =>
      useTenantDetailsValues(DEFAULT_TENANT, undefined),
    );

    expect(result.current.values.ownerEmail).toBe('');
  });

  it('lists each field that differs from the saved values', () => {
    const { result } = renderValues();

    act(() => result.current.updateField('name', MOCK_RENAMED_TENANT_NAME));
    act(() => result.current.updateField('locale', LOCALE_ISO_CODES.NL));

    expect(result.current.changedFieldKeys).toEqual(['name', 'locale']);

    act(() => result.current.updateField('name', MOCK_TENANT_NAME));

    expect(result.current.changedFieldKeys).toEqual(['locale']);
  });

  it('reverts only the given fields to their saved values', () => {
    const { result } = renderValues();
    act(() => result.current.updateField('name', MOCK_RENAMED_TENANT_NAME));
    act(() => result.current.updateField('primaryDomain', MOCK_UNSAVED_DOMAIN));

    act(() => result.current.revertFields(['primaryDomain']));

    expect(result.current.values.primaryDomain).toBe(MOCK_TENANT_DOMAIN);
    expect(result.current.values.name).toBe(MOCK_RENAMED_TENANT_NAME);
  });

  it('resets every field to its saved value', () => {
    const { result } = renderValues();
    act(() => result.current.updateField('name', MOCK_RENAMED_TENANT_NAME));
    act(() => result.current.updateField('ownerEmail', MOCK_NEW_OWNER_EMAIL));

    act(() => result.current.resetValues());

    expect(result.current.changedFieldKeys).toEqual([]);
  });

  it('takes the refreshed tenant as the new saved values', () => {
    const { result, rerender } = renderValues();
    act(() => result.current.updateField('name', MOCK_RENAMED_TENANT_NAME));

    rerender({
      tenant: mockClientTenant({ name: MOCK_RENAMED_TENANT_NAME }),
      ownerEmail: MOCK_OWNER_EMAIL,
    });

    expect(result.current.values.name).toBe(MOCK_RENAMED_TENANT_NAME);
    expect(result.current.changedFieldKeys).toEqual([]);
  });
});
