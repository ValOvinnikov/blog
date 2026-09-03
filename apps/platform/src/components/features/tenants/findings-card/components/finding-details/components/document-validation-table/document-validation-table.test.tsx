import { renderWithIntl, screen } from '@platform/testing/custom-render';

import type { TSanityValidationResult } from '../../parse-document-validation-details';

import { DocumentValidationTable } from './document-validation-table';

const render = renderWithIntl;

describe(DocumentValidationTable, () => {
  it('renders one row per marker, with a badge for each level', () => {
    const documents: TSanityValidationResult[] = [
      {
        documentId: 'provisioning.author.starter',
        documentType: 'blog_author',
        markers: [{ level: 'warning', message: "Field 'slug' does not exist" }],
      },
    ];

    render(<DocumentValidationTable documents={documents} />);

    expect(screen.getByRole('columnheader', { name: 'Level' })).toBeVisible();
    expect(
      screen.getByRole('columnheader', { name: 'Document' }),
    ).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Message' })).toBeVisible();
    expect(screen.getByText('Warning')).toBeVisible();
    expect(screen.getByText('blog_author')).toBeVisible();
    expect(screen.getByText('provisioning.author.starter')).toBeVisible();
    expect(screen.getByText("Field 'slug' does not exist")).toBeVisible();
  });

  it('renders one row per marker for a document with mixed-level markers', () => {
    const documents: TSanityValidationResult[] = [
      {
        documentId: 'doc-1',
        documentType: 'blog_post',
        markers: [
          { level: 'error', message: 'Missing required field' },
          { level: 'warning', message: 'Deprecated field used' },
        ],
      },
    ];

    render(<DocumentValidationTable documents={documents} />);

    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('Error')).toBeVisible();
    expect(screen.getByText('Warning')).toBeVisible();
    expect(screen.getByText('Missing required field')).toBeVisible();
    expect(screen.getByText('Deprecated field used')).toBeVisible();
  });
});
