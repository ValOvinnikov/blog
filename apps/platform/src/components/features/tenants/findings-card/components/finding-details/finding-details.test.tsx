import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockDocumentValidationDetails,
  mockValidationResult,
} from '@platform/testing/features/tenants/findings-card/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FindingDetails } from './finding-details';

const { getFindingDetailsActionMock } = vi.hoisted(() => ({
  getFindingDetailsActionMock: vi.fn(),
}));

vi.mock('@platform/server/findings/get-finding-details-action', () => ({
  getFindingDetailsAction: getFindingDetailsActionMock,
}));

faker.seed(5994);

const MOCK_FINDING_ID = faker.string.uuid();
const MOCK_DOCUMENT_TYPE = faker.word.noun();
const MOCK_UNRECOGNISED_DETAILS = {
  step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
};
const UNRECOGNISED_DETAILS_JSON = new RegExp(
  `"step": "${TENANT_PROVISIONING_STEP.MAP_DOMAIN}"`,
);

const setup = customRender(FindingDetails, {
  tenantId: MOCK_TENANT_ID,
  findingId: MOCK_FINDING_ID,
});

describe(`<${FindingDetails.name}/>`, () => {
  let user: UserEvent;

  const getDetailsToggle = () => screen.getByText('Details');

  beforeEach(() => {
    user = userEvent.setup();
    getFindingDetailsActionMock.mockReset();
    setup();
  });

  it('requests nothing until the disclosure is opened', () => {
    expect(getFindingDetailsActionMock).not.toHaveBeenCalled();
  });

  it('shows a labelled spinner while the details load', async () => {
    getFindingDetailsActionMock.mockReturnValue(new Promise(() => {}));

    const detailsToggle = getDetailsToggle();
    await user.click(detailsToggle);

    const spinner = screen.getByRole('status', { name: 'Loading details…' });

    expect(spinner).toBeVisible();
    expect(getFindingDetailsActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_FINDING_ID,
    );
  });

  it('renders recognised document validation details as a table', async () => {
    getFindingDetailsActionMock.mockResolvedValue(
      mockDocumentValidationDetails({
        documents: [mockValidationResult({ documentType: MOCK_DOCUMENT_TYPE })],
      }),
    );

    const detailsToggle = getDetailsToggle();
    await user.click(detailsToggle);

    const table = await screen.findByRole('table');
    const documentType = screen.getByText(MOCK_DOCUMENT_TYPE);
    const rawCount = screen.queryByText(/invalidDocumentCount/);

    expect(table).toBeVisible();
    expect(documentType).toBeVisible();
    expect(rawCount).not.toBeInTheDocument();
  });

  it('falls back to raw JSON for an unrecognised details shape', async () => {
    getFindingDetailsActionMock.mockResolvedValue(MOCK_UNRECOGNISED_DETAILS);

    const detailsToggle = getDetailsToggle();
    await user.click(detailsToggle);

    const rawJson = await screen.findByText(UNRECOGNISED_DETAILS_JSON);
    const table = screen.queryByRole('table');

    expect(rawJson).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });

  it('reuses the loaded details when reopened', async () => {
    getFindingDetailsActionMock.mockResolvedValue(MOCK_UNRECOGNISED_DETAILS);

    const detailsToggle = getDetailsToggle();
    await user.click(detailsToggle);
    await screen.findByText(UNRECOGNISED_DETAILS_JSON);
    await user.click(detailsToggle);
    await user.click(detailsToggle);

    const rawJson = screen.getByText(UNRECOGNISED_DETAILS_JSON);

    expect(rawJson).toBeVisible();
    expect(getFindingDetailsActionMock).toHaveBeenCalledTimes(1);
  });

  it('retries on the next open after a failed request', async () => {
    getFindingDetailsActionMock
      .mockRejectedValueOnce(new Error(faker.lorem.word()))
      .mockResolvedValueOnce(MOCK_UNRECOGNISED_DETAILS);

    const detailsToggle = getDetailsToggle();
    await user.click(detailsToggle);
    await user.click(detailsToggle);
    await user.click(detailsToggle);

    const rawJson = await screen.findByText(UNRECOGNISED_DETAILS_JSON);

    expect(rawJson).toBeVisible();
    expect(getFindingDetailsActionMock).toHaveBeenCalledTimes(2);
  });
});
