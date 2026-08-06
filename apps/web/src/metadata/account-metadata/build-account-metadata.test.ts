import { buildAccountMetadata } from './build-account-metadata';

describe(buildAccountMetadata, () => {
  it('builds noindex metadata self-canonical to /account', async () => {
    const metadata = await buildAccountMetadata();

    expect(metadata.title).toBe('Account');
    expect(metadata.description).toBe(
      'Manage your privacy and data — export or delete your account.',
    );
    expect(metadata.alternates?.canonical).toBe('/account');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
