import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';

const getLinkField = () => {
  const field = linkRefSchema.fields.find(
    (field): field is typeof field & { name: 'link' } =>
      'name' in field && field.name === 'link',
  );

  if (!field) {
    throw new Error('Expected linkRefSchema to define a "link" field.');
  }

  return field;
};

describe(linkRefSchema, () => {
  it('references the link document', () => {
    const field = getLinkField();

    expect(field.type).toBe('reference');
    expect('to' in field ? field.to : undefined).toEqual([
      { type: linkSchema.name },
    ]);
  });

  it('requires the link field', () => {
    const field = getLinkField();
    let requiredCalled = false;

    const rule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
    };

    if (!('validation' in field) || !field.validation) {
      throw new Error('Expected the "link" field to define validation.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (field.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });

  describe('preview.prepare', () => {
    const prepare = linkRefSchema.preview?.prepare;

    it('prefers the link title', () => {
      expect(
        prepare?.({ title: 'Docs', label: 'Read the docs' }),
      ).toMatchObject({ title: 'Docs' });
    });

    it('falls back to the link label, then a placeholder', () => {
      expect(
        prepare?.({ title: undefined, label: 'Read the docs' }),
      ).toMatchObject({ title: 'Read the docs' });
      expect(prepare?.({ title: undefined, label: undefined })).toMatchObject({
        title: 'No link selected',
      });
    });
  });
});
