import { normalizeEmailIdentity } from './normalize-email-identity';

const ADDRESS = 'editor@example.org';
const PLUS_IN_DOMAIN = 'editor@ex+ample.org';

describe(normalizeEmailIdentity, () => {
  it('lower-cases and trims an address', () => {
    expect(normalizeEmailIdentity('  Editor@Example.ORG ')).toBe(ADDRESS);
  });

  it('drops a +tag from the local part', () => {
    expect(normalizeEmailIdentity('editor+news+weekly@example.org')).toBe(
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
