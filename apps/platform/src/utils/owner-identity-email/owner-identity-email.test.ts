import { toOwnerIdentityEmail } from './owner-identity-email';

const TAG_ONLY_ADDRESS = '+tag@example.com';

describe('toOwnerIdentityEmail', () => {
  it('treats +tag variants of one inbox as the same address', () => {
    expect(toOwnerIdentityEmail('Name+1@Example.com')).toBe(
      toOwnerIdentityEmail('name+2@example.com'),
    );
  });

  it('removes the +tag and lower-cases the address', () => {
    expect(toOwnerIdentityEmail(' Name+signup@Example.com ')).toBe(
      'name@example.com',
    );
  });

  it('leaves an address without a +tag unchanged apart from case', () => {
    expect(toOwnerIdentityEmail('Jo.Bloggs@example.com')).toBe(
      'jo.bloggs@example.com',
    );
  });

  it('keeps an address whose local part is only a +tag', () => {
    expect(toOwnerIdentityEmail(TAG_ONLY_ADDRESS)).toBe(TAG_ONLY_ADDRESS);
  });
});
