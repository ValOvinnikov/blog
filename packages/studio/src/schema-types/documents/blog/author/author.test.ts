import { authorSchema } from '@blog/studio/schema-types/documents/blog/author/author';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';
import { getField } from '@blog/studio/testing/get-field';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ type?: string }>;
};

describe('authorSchema profilePage field', () => {
  const getProfilePageField = () =>
    getField(authorSchema, 'profilePage') as TReferenceFieldDefinition;

  it('references the link document, not a specific page type', () => {
    const profilePageField = getProfilePageField();

    if (!profilePageField || profilePageField.type !== 'reference') {
      throw new Error(
        'Expected authorSchema to define a profilePage reference field.',
      );
    }

    expect(profilePageField.to?.map((target) => target.type)).toEqual([
      linkSchema.name,
    ]);
  });

  it('stays optional — no validation() builder attached', () => {
    expect(getProfilePageField()?.validation).toBeUndefined();
  });
});

describe('authorSchema socialLinks field', () => {
  it('is an array of socialProfile', () => {
    const socialLinksField = getField(
      authorSchema,
      'socialLinks',
    ) as TArrayFieldDefinition;

    if (socialLinksField.type !== 'array') {
      throw new Error(
        'Expected authorSchema to define a socialLinks array field.',
      );
    }

    expect(socialLinksField.of?.map((member) => member.type)).toEqual([
      socialProfileSchema.name,
    ]);
  });
});

describe('authorSchema slug field', () => {
  it('is not defined — removed in favor of profilePage', () => {
    expect(
      authorSchema.fields?.find((field) => field.name === 'slug'),
    ).toBeUndefined();
  });
});
