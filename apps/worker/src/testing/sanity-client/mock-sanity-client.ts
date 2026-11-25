import type { SanityClient } from '@sanity/client';

export function mockSanityClient() {
  const upload = vi.fn();
  const fetch = vi.fn();
  const createIfNotExists = vi.fn();
  const patch = vi.fn();
  const deleteDocument = vi.fn();
  const commit = vi.fn();
  const transaction = vi.fn(() => ({
    createIfNotExists,
    patch,
    delete: deleteDocument,
    commit,
  }));
  const client = {
    assets: { upload },
    fetch,
    transaction,
  } as unknown as SanityClient;

  return {
    client,
    upload,
    fetch,
    transaction,
    createIfNotExists,
    patch,
    deleteDocument,
    commit,
  };
}

export type TMockSanityClient = ReturnType<typeof mockSanityClient>;
