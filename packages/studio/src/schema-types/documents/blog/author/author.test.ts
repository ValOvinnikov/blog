import { authorSchema } from '@blog/studio/schema-types/documents/blog/author/author';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ type?: string }>;
};

const getField = (name: string) =>
  authorSchema.fields?.find((field) => field.name === name);

describe('authorSchema profilePage field', () => {
  const getProfilePageField = () =>
    getField('profilePage') as TReferenceFieldDefinition | undefined;

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
    const socialLinksField = getField('socialLinks') as
      TArrayFieldDefinition | undefined;

    if (!socialLinksField || socialLinksField.type !== 'array') {
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
    expect(getField('slug')).toBeUndefined();
  });
});
