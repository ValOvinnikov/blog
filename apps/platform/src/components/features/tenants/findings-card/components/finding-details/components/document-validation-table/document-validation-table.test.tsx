import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockValidationResult } from '@platform/testing/features/tenants/findings-card/fixtures';

import { DocumentValidationTable } from './document-validation-table';

faker.seed(5994);

const MOCK_DOCUMENT_ID = faker.string.uuid();
const MOCK_DOCUMENT_TYPE = faker.word.noun();
const MOCK_ERROR_MESSAGE = faker.lorem.sentence();
const MOCK_WARNING_MESSAGE = faker.lorem.sentence();

const setup = customRender(DocumentValidationTable, {
  documents: [
    mockValidationResult({
      documentId: MOCK_DOCUMENT_ID,
      documentType: MOCK_DOCUMENT_TYPE,
      markers: [{ level: 'warning', message: MOCK_WARNING_MESSAGE }],
    }),
  ],
});

describe(`<${DocumentValidationTable.name}/>`, () => {
  it('shows the level, document and message columns', () => {
    setup();

    const levelHeader = screen.getByRole('columnheader', { name: 'Level' });
    const documentHeader = screen.getByRole('columnheader', {
      name: 'Document',
    });
    const messageHeader = screen.getByRole('columnheader', { name: 'Message' });

    expect(levelHeader).toBeVisible();
    expect(documentHeader).toBeVisible();
    expect(messageHeader).toBeVisible();
  });

  it('describes a marker with its level, document type, id and message', () => {
    setup();

    const level = screen.getByText('Warning');
    const documentType = screen.getByText(MOCK_DOCUMENT_TYPE);
    const documentId = screen.getByText(MOCK_DOCUMENT_ID);
    const message = screen.getByText(MOCK_WARNING_MESSAGE);

    expect(level).toBeVisible();
    expect(documentType).toBeVisible();
    expect(documentId).toBeVisible();
    expect(message).toBeVisible();
  });

  it('renders one row per marker for a document with mixed-level markers', () => {
    setup({
      documents: [
        mockValidationResult({
          markers: [
            { level: 'error', message: MOCK_ERROR_MESSAGE },
            { level: 'warning', message: MOCK_WARNING_MESSAGE },
          ],
        }),
      ],
    });

    const rows = screen.getAllByRole('row');
    const errorLevel = screen.getByText('Error');
    const warningLevel = screen.getByText('Warning');
    const errorMessage = screen.getByText(MOCK_ERROR_MESSAGE);
    const warningMessage = screen.getByText(MOCK_WARNING_MESSAGE);

    expect(rows).toHaveLength(3);
    expect(errorLevel).toBeVisible();
    expect(warningLevel).toBeVisible();
    expect(errorMessage).toBeVisible();
    expect(warningMessage).toBeVisible();
  });
});
