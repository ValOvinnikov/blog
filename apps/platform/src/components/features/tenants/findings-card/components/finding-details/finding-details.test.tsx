import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { FindingDetails } from './finding-details';

const render = renderWithIntl;

describe(FindingDetails, () => {
  it('renders the recognized DOCUMENT_VALIDATION shape as a table once opened', async () => {
    const user = userEvent.setup();
    render(
      <FindingDetails
        details={{
          invalidDocumentCount: 1,
          documents: [
            {
              documentId: 'provisioning.author.starter',
              documentType: 'blog_author',
              markers: [{ level: 'warning', message: "Field 'slug' missing" }],
            },
          ],
        }}
      />,
    );

    await user.click(screen.getByText('Details'));

    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText('blog_author')).toBeVisible();
    expect(screen.queryByText(/invalidDocumentCount/)).not.toBeInTheDocument();
  });

  it('falls back to a raw JSON dump for an unrecognized details shape', async () => {
    const user = userEvent.setup();
    render(<FindingDetails details={{ step: 'MAP_DOMAIN' }} />);

    await user.click(screen.getByText('Details'));

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText(/"step": "MAP_DOMAIN"/)).toBeVisible();
  });
});
