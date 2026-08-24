import { authorSchema } from '@cms/schema-types/documents/blog/author';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

const getField = (name: string) =>
  authorSchema.fields?.find((field) => field.name === name);

describe('authorSchema profilePage field', () => {
  const getProfilePageField = () =>
    getField('profilePage') as TReferenceFieldDefinition | undefined;

  it('references page_generic only', () => {
    const profilePageField = getProfilePageField();

    if (!profilePageField || profilePageField.type !== 'reference') {
      throw new Error(
        'Expected authorSchema to define a profilePage reference field.',
      );
    }

    expect(profilePageField.to?.map((target) => target.type)).toEqual([
      'page_generic',
    ]);
  });

  it('stays optional — no validation() builder attached', () => {
    expect(getProfilePageField()?.validation).toBeUndefined();
  });
});

describe('authorSchema slug field', () => {
  it('is not defined — removed in favor of profilePage', () => {
    expect(getField('slug')).toBeUndefined();
  });
});
