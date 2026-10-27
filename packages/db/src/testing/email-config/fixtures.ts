import { faker } from '@faker-js/faker';

faker.seed(61002);

export const MOCK_EMAIL_CONFIG = {
  logoAssetUrl: faker.internet.url(),
  senderName: faker.company.name(),
  replyToAddress: faker.internet.email().toLowerCase(),
  footerPostalAddress: faker.location.streetAddress(),
  contactRecipient: faker.internet.email().toLowerCase(),
};
