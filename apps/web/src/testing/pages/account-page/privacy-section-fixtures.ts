import { faker } from '@faker-js/faker';
import type { IPrivacySectionProps } from '@web/components/pages/account-page/sections/privacy-section/privacy-section';

faker.seed(61034);

const MOCK_HANDLE = faker.string.alphanumeric(8);
const MOCK_PRIVACY_HEADING = faker.lorem.word();
const MOCK_EXPORT_LABEL = faker.lorem.words(3);
const MOCK_EXPORT_DESCRIPTION = faker.lorem.sentence();
const MOCK_EXPORT_BUTTON = faker.lorem.words(2);
const MOCK_DELETE_LABEL = faker.lorem.words(2);
const MOCK_DELETE_DESCRIPTION = faker.lorem.sentence();

export const mockPrivacySection = (
  overrides: Partial<IPrivacySectionProps> = {},
): IPrivacySectionProps => {
  return {
    handle: MOCK_HANDLE,
    heading: MOCK_PRIVACY_HEADING,
    exportLabel: MOCK_EXPORT_LABEL,
    exportDescription: MOCK_EXPORT_DESCRIPTION,
    exportButton: MOCK_EXPORT_BUTTON,
    deleteLabel: MOCK_DELETE_LABEL,
    deleteDescription: MOCK_DELETE_DESCRIPTION,
    ...overrides,
  };
};
