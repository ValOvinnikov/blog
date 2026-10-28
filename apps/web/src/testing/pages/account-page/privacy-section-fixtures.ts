import type { IPrivacySectionProps } from '@web/components/pages/account-page/sections/privacy-section/privacy-section';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61034);

const MOCK_HANDLE = mockFaker.string.alphanumeric(8);
const MOCK_PRIVACY_HEADING = mockFaker.lorem.word();
const MOCK_EXPORT_LABEL = mockFaker.lorem.words(3);
const MOCK_EXPORT_DESCRIPTION = mockFaker.lorem.sentence();
const MOCK_EXPORT_BUTTON = mockFaker.lorem.words(2);
const MOCK_DELETE_LABEL = mockFaker.lorem.words(2);
const MOCK_DELETE_DESCRIPTION = mockFaker.lorem.sentence();

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
