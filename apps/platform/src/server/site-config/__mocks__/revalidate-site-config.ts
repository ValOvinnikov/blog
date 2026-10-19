export const revalidateSiteConfig = vi.fn<(tenantId: string) => Promise<void>>(
  async () => undefined,
);
