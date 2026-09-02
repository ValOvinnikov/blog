import { resolveTenant } from './resolve-tenant';
import { resolveTenantId } from './resolve-tenant-id';

vi.mock('./resolve-tenant', () => ({ resolveTenant: vi.fn() }));

describe(resolveTenantId, () => {
  beforeEach(() => {
    vi.mocked(resolveTenant).mockReset();
  });

  it("delegates to resolveTenant and returns the resolved row's id", async () => {
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    } as never);

    await expect(resolveTenantId('acme.example.com')).resolves.toBe('tenant-1');
    expect(resolveTenant).toHaveBeenCalledWith('acme.example.com');
  });

  it('resolves undefined when resolveTenant resolves no tenant', async () => {
    vi.mocked(resolveTenant).mockResolvedValue(undefined);

    await expect(
      resolveTenantId('unknown.example.com'),
    ).resolves.toBeUndefined();
  });

  it('passes a null host through unchanged', async () => {
    vi.mocked(resolveTenant).mockResolvedValue({ id: 'tenant-1' } as never);

    await expect(resolveTenantId(null)).resolves.toBe('tenant-1');
    expect(resolveTenant).toHaveBeenCalledWith(null);
  });
});
