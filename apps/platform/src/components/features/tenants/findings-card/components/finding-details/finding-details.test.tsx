import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FindingDetails } from './finding-details';

const { getFindingDetailsActionMock } = vi.hoisted(() => ({
  getFindingDetailsActionMock: vi.fn(),
}));

vi.mock('@platform/server/findings/get-finding-details-action', () => ({
  getFindingDetailsAction: getFindingDetailsActionMock,
}));

const render = renderWithIntl;

describe(FindingDetails, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    getFindingDetailsActionMock.mockReset();
  });

  it('requests nothing until the disclosure is opened', () => {
    render(<FindingDetails tenantId="tenant-1" findingId="finding-1" />);

    expect(getFindingDetailsActionMock).not.toHaveBeenCalled();
  });

  it('shows a labelled spinner while the details load', async () => {
    getFindingDetailsActionMock.mockReturnValue(new Promise(() => {}));
    render(<FindingDetails tenantId="tenant-1" findingId="finding-1" />);

    await user.click(screen.getByText('Details'));

    expect(
      screen.getByRole('status', { name: 'Loading details…' }),
    ).toBeVisible();
    expect(getFindingDetailsActionMock).toHaveBeenCalledWith(
      'tenant-1',
      'finding-1',
    );
  });

  it('renders the recognized DOCUMENT_VALIDATION shape as a table once loaded', async () => {
    getFindingDetailsActionMock.mockResolvedValue({
      invalidDocumentCount: 1,
      documents: [
        {
          documentId: 'provisioning.author.starter',
          documentType: 'person',
          markers: [{ level: 'warning', message: "Field 'slug' missing" }],
        },
      ],
    });
    render(<FindingDetails tenantId="tenant-1" findingId="finding-1" />);

    await user.click(screen.getByText('Details'));

    expect(await screen.findByRole('table')).toBeVisible();
    expect(screen.getByText('person')).toBeVisible();
    expect(screen.queryByText(/invalidDocumentCount/)).not.toBeInTheDocument();
  });

  it('falls back to a raw JSON dump for an unrecognized details shape', async () => {
    getFindingDetailsActionMock.mockResolvedValue({ step: 'MAP_DOMAIN' });
    render(<FindingDetails tenantId="tenant-1" findingId="finding-1" />);

    await user.click(screen.getByText('Details'));

    expect(await screen.findByText(/"step": "MAP_DOMAIN"/)).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('reuses the loaded details when reopened', async () => {
    getFindingDetailsActionMock.mockResolvedValue({ step: 'MAP_DOMAIN' });
    render(<FindingDetails tenantId="tenant-1" findingId="finding-1" />);

    await user.click(screen.getByText('Details'));
    await screen.findByText(/"step": "MAP_DOMAIN"/);
    await user.click(screen.getByText('Details'));
    await user.click(screen.getByText('Details'));

    expect(screen.getByText(/"step": "MAP_DOMAIN"/)).toBeVisible();
    expect(getFindingDetailsActionMock).toHaveBeenCalledTimes(1);
  });

  it('retries on the next open after a failed request', async () => {
    getFindingDetailsActionMock
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ step: 'MAP_DOMAIN' });
    render(<FindingDetails tenantId="tenant-1" findingId="finding-1" />);

    await user.click(screen.getByText('Details'));
    await user.click(screen.getByText('Details'));
    await user.click(screen.getByText('Details'));

    expect(await screen.findByText(/"step": "MAP_DOMAIN"/)).toBeVisible();
    expect(getFindingDetailsActionMock).toHaveBeenCalledTimes(2);
  });
});
