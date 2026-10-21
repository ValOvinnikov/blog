import { normalizeEmailIdentity } from './normalize-email-identity';

const ADDRESS = 'reader@example.com';
const PLUS_IN_DOMAIN = 'reader@ex+ample.com';

describe(normalizeEmailIdentity, () => {
  it('lower-cases and trims an address', () => {
    expect(normalizeEmailIdentity('  Reader@Example.COM ')).toBe(ADDRESS);
  });

  it('drops a +tag from the local part', () => {
    expect(normalizeEmailIdentity('reader+news+weekly@example.com')).toBe(
      ADDRESS,
    );
  });

  it('keeps a + that sits in the domain', () => {
    expect(normalizeEmailIdentity(PLUS_IN_DOMAIN)).toBe(PLUS_IN_DOMAIN);
  });

  it('leaves an address without an @ lower-cased and trimmed', () => {
    expect(normalizeEmailIdentity(' Not-An-Address ')).toBe('not-an-address');
  });
});
