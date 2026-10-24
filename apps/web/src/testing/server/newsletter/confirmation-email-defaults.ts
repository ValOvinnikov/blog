import type { resolveTenantEmailBrand } from '@blog/config';
import type { TEmailConfigResult } from '@blog/db/queries/email-config/get-email-config/get-email-config';
import { faker } from '@faker-js/faker';

import { confirmationEmailEdges } from './confirmation-email-edges';
import { mockEmailConfig, mockEmailTemplate } from './fixtures';

interface IConfirmationEmailDefaults {
  brand: ReturnType<typeof resolveTenantEmailBrand>;
  brandName?: string;
  emailConfig?: TEmailConfigResult;
  claim?: { claimedAt: Date; confirmationToken: string };
}

export const setConfirmationEmailDefaults = ({
  brand,
  brandName = faker.company.name(),
  emailConfig = mockEmailConfig(),
  claim = {
    claimedAt: faker.date.recent(),
    confirmationToken: faker.string.alphanumeric(16),
  },
}: IConfirmationEmailDefaults) => {
  confirmationEmailEdges.sendEmail.mockResolvedValue(undefined);
  confirmationEmailEdges.resolveTenantEmailIdentity.mockResolvedValue({
    brand,
    brandName,
  });
  confirmationEmailEdges.getEmailConfig.mockResolvedValue(emailConfig);
  confirmationEmailEdges.getEmailTemplate.mockResolvedValue(
    mockEmailTemplate(),
  );
  confirmationEmailEdges.claimConfirmationSend.mockResolvedValue(claim);
  confirmationEmailEdges.releaseConfirmationSend.mockResolvedValue(undefined);
  confirmationEmailEdges.commitConfirmationToken.mockResolvedValue(undefined);
};
