import { SAMPLE_HEADER_TEST_ID } from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { createMockFaker } from '@platform/testing/mock-faker';
import type { UserEvent } from '@testing-library/user-event';

const mockFaker = createMockFaker(6759);

export const MOCK_BRAND_NAME = mockFaker.company.name();

export const brandNameInput = () =>
  screen.getByRole('textbox', {
    name: new RegExp(`^${messages.lookForm.brandNameLabel}`),
  });

export const previewHeader = () => screen.getByTestId(SAMPLE_HEADER_TEST_ID);

export const enterBrandName = async (user: UserEvent, value: string) => {
  await user.click(brandNameInput());
  await user.paste(value);
};
