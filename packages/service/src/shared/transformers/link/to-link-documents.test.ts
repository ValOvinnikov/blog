import {
  mockLinkView,
  mockRawExternalLinkDocument,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toLinkDocuments } from './to-link-documents';

faker.seed(6075);

const MOCK_FIRST_URL = faker.internet.url();
const MOCK_SECOND_URL = faker.internet.url();

describe(toLinkDocuments, () => {
  it.each([null, undefined, []])('returns an empty array for %j', (raw) => {
    const result = toLinkDocuments(raw);

    expect(result).toEqual([]);
  });

  it('maps every resolvable link in order and drops the rest', () => {
    const result = toLinkDocuments([
      mockRawExternalLinkDocument({ url: MOCK_FIRST_URL }),
      null,
      mockRawExternalLinkDocument({ label: null }),
      mockRawExternalLinkDocument({ url: MOCK_SECOND_URL }),
    ]);

    expect(result).toEqual([
      mockLinkView({ href: MOCK_FIRST_URL }),
      mockLinkView({ href: MOCK_SECOND_URL }),
    ]);
  });
});
