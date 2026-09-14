import { sharedLinkSchema } from '@blog/studio/schema-types/documents/shared/link/link';
import { linkRefFields } from '@blog/studio/schema-types/fields/link-ref-fields/link-ref-fields';

const getField = (name: string) => {
  const field = linkRefFields().find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected linkRefFields() to define a "${name}" field.`);
  }

  return field;
};

const wasRequiredCalled = (field: { validation?: unknown }) => {
  if (!field.validation) {
    return false;
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

describe('linkRefFields link', () => {
  it('is a required reference to shared_link', () => {
    const field = getField('link');
    const { type, to } = field as unknown as {
      type: string;
      to?: { type: string }[];
    };

    expect(type).toBe('reference');
    expect(to).toEqual([{ type: sharedLinkSchema.name }]);
    expect(wasRequiredCalled(field)).toBe(true);
  });
});

describe('linkRefFields labelOverride', () => {
  it('is an optional string, with no validation', () => {
    const field = getField('labelOverride');

    expect(field.type).toBe('string');
    expect(field.validation).toBeUndefined();
  });
});
