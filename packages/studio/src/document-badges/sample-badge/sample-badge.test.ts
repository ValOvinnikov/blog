import { faker } from '@faker-js/faker';
import { STARTER_DOCUMENT_ID_PREFIX } from '@shinefold/config/constants';
import type { DocumentBadgeProps } from 'sanity';

import { SampleBadge } from './sample-badge';

faker.seed(4970);

const badgeFor = (id: string) => SampleBadge({ id } as DocumentBadgeProps);

describe(SampleBadge, () => {
  it('badges a starter document', () => {
    expect(
      badgeFor(`${STARTER_DOCUMENT_ID_PREFIX}${faker.lorem.word()}`),
    ).not.toBeNull();
  });

  it('leaves any other document unbadged', () => {
    expect(badgeFor(faker.string.uuid())).toBeNull();
  });
});
