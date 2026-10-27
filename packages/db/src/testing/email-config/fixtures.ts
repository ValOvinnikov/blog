import { createMockFaker } from '@blog/db/testing/mock-faker';

const emailConfigFaker = createMockFaker(61002);

export const MOCK_EMAIL_CONFIG = {
  logoAssetUrl: emailConfigFaker.internet.url(),
  senderName: emailConfigFaker.company.name(),
  replyToAddress: emailConfigFaker.internet.email().toLowerCase(),
  footerPostalAddress: emailConfigFaker.location.streetAddress(),
  contactRecipient: emailConfigFaker.internet.email().toLowerCase(),
};
