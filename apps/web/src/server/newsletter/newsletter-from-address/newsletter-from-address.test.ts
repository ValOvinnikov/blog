import { faker } from '@faker-js/faker';

import { resolveNewsletterFromAddress } from './newsletter-from-address';

faker.seed(6010);

const MOCK_CONFIGURED_FROM_ADDRESS = `${faker.company.name()} <${faker.internet.email()}>`;

describe(resolveNewsletterFromAddress, () => {
  it('uses the configured address when set', () => {
    const fromAddress = resolveNewsletterFromAddress(
      MOCK_CONFIGURED_FROM_ADDRESS,
    );

    expect(fromAddress).toBe(MOCK_CONFIGURED_FROM_ADDRESS);
  });

  it('falls back to a default sender when unset', () => {
    const fromAddress = resolveNewsletterFromAddress(undefined);

    expect(fromAddress).toBeTruthy();
  });
});
