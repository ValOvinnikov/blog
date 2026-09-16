import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABEL,
} from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';

const getField = (name: string) => {
  const field = socialProfileSchema.fields.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(
      `Expected socialProfileSchema to define a "${name}" field.`,
    );
  }

  return field;
};

const getLayout = (field: { options?: unknown }) => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

const getOptionValues = (field: { options?: unknown }) => {
  const options = field.options;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? (options as { list: unknown }).list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return list as { title: string; value: string }[];
};

const wasRequiredCalled = (field: { validation?: unknown }) => {
  if (!field.validation) {
    throw new Error('Expected field to define validation.');
  }

  let requiredCalled = false;
  const rule = {
    required: () => {
      requiredCalled = true;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return requiredCalled;
};

describe('socialProfileSchema fields', () => {
  it('requires a link reference to the link document', () => {
    const field = getField('link');

    expect(field.type).toBe('reference');
    expect('to' in field ? field.to : undefined).toEqual([
      { type: linkSchema.name },
    ]);
    expect(wasRequiredCalled(field)).toBe(true);
  });

  it('requires platform as a radio, titled from SOCIAL_PLATFORM_LABEL', () => {
    const field = getField('platform');

    expect(getLayout(field)).toBe('radio');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getOptionValues(field)).toEqual(
      Object.values(SOCIAL_PLATFORMS).map((value) => ({
        title: SOCIAL_PLATFORM_LABEL[value],
        value,
      })),
    );
  });
});

describe('socialProfileSchema preview', () => {
  const prepare = socialProfileSchema.preview?.prepare;

  it('titles by the link label and subtitles by platform', () => {
    expect(
      prepare?.({
        title: 'Val on LinkedIn',
        platform: SOCIAL_PLATFORMS.LINKEDIN,
      }),
    ).toEqual({ title: 'Val on LinkedIn', subtitle: 'LinkedIn' });
  });

  it('falls back to the platform label, then a placeholder', () => {
    expect(
      prepare?.({ title: undefined, platform: SOCIAL_PLATFORMS.GITHUB }),
    ).toMatchObject({ title: 'GitHub' });
    expect(prepare?.({ title: undefined, platform: undefined })).toMatchObject({
      title: 'No link selected',
    });
  });
});
