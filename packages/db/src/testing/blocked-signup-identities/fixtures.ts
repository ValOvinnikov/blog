export const MOCK_BLOCKED_ADDRESS = 'blocked@example.com';
export const MOCK_BLOCKED_ADDRESS_DOMAIN = 'example.com';
export const MOCK_BLOCKED_ADDRESS_INDEX =
  'tHLNf2J7Sg8FJOE9HsypH3RHE1QoltUb1Y0nedd0EKc';
export const MOCK_BLOCKED_DOMAIN = 'mailinator.com';
export const MOCK_BLOCK_REASON = 'Spam tenant';
export const MOCK_NOT_A_DOMAIN = 'https://example.com';
export const MOCK_NOT_AN_ADDRESS = 'not-an-address';
export const MOCK_BLOCKED_ADDRESS_TAGGED_VARIANT = MOCK_BLOCKED_ADDRESS.replace(
  '@',
  '+promo@',
);
export const MOCK_BLOCKED_ADDRESS_UPPERCASED_VARIANT = ` ${MOCK_BLOCKED_ADDRESS.toUpperCase()} `;
export const MOCK_BLOCKED_DOMAIN_UPPERCASED_VARIANT = ` ${MOCK_BLOCKED_DOMAIN.toUpperCase()} `;
export const MOCK_BLOCKED_DOMAIN_ADDRESS = `anyone@${MOCK_BLOCKED_DOMAIN}`;
export const MOCK_BLOCKED_DOMAIN_SUBDOMAIN_ADDRESS = `anyone@eu.${MOCK_BLOCKED_DOMAIN}`;
export const MOCK_SAME_DOMAIN_OTHER_ADDRESS = `grace@${MOCK_BLOCKED_ADDRESS_DOMAIN}`;
