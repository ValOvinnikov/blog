import { parseDocumentValidationDetails } from './parse-document-validation-details';

describe(parseDocumentValidationDetails, () => {
  it('parses the DOCUMENT_VALIDATION/SCHEMA_VALIDATION_ERROR shape', () => {
    const details = {
      invalidDocumentCount: 1,
      documents: [
        {
          documentId: 'provisioning.author.starter',
          documentType: 'blog_author',
          markers: [{ level: 'warning', message: "Field 'slug' missing" }],
        },
      ],
    };

    expect(parseDocumentValidationDetails(details)).toEqual({
      invalidDocumentCount: 1,
      documents: details.documents,
    });
  });

  it('returns null when invalidDocumentCount is missing', () => {
    expect(
      parseDocumentValidationDetails({
        documents: [
          {
            documentId: 'doc-1',
            documentType: 'blog_author',
            markers: [{ level: 'error', message: 'bad' }],
          },
        ],
      }),
    ).toBeNull();
  });

  it('returns null when documents is missing', () => {
    expect(
      parseDocumentValidationDetails({ invalidDocumentCount: 1 }),
    ).toBeNull();
  });

  it('returns null when a marker has an unrecognized level', () => {
    expect(
      parseDocumentValidationDetails({
        invalidDocumentCount: 1,
        documents: [
          {
            documentId: 'doc-1',
            documentType: 'blog_author',
            markers: [{ level: 'critical', message: 'bad' }],
          },
        ],
      }),
    ).toBeNull();
  });

  it('returns null for an unrelated details shape', () => {
    expect(parseDocumentValidationDetails({ step: 'MAP_DOMAIN' })).toBeNull();
  });
});
