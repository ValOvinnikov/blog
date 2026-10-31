import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { studioEnteredCookie } from '@platform/utils/studio-entered-cookie/studio-entered-cookie';

import { resolveHasEnteredStudio } from './resolve-has-entered-studio';

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const mockCookieNames = (names: string[]) => {
  cookiesMock.mockResolvedValue({
    has: vi.fn((name: string) => names.includes(name)),
  });
};

describe(resolveHasEnteredStudio, () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it("resolves true once the tenant's Studio entry is recorded", async () => {
    mockCookieNames([studioEnteredCookie(MOCK_TENANT_ID)]);

    expect(await resolveHasEnteredStudio(MOCK_TENANT_ID)).toBe(true);
  });

  it("resolves false when only another tenant's Studio entry is recorded", async () => {
    mockCookieNames([studioEnteredCookie(MOCK_OTHER_TENANT_ID)]);

    expect(await resolveHasEnteredStudio(MOCK_TENANT_ID)).toBe(false);
  });
});
