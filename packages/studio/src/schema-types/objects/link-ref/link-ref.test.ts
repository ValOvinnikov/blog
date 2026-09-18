import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';

describe('linkRefSchema preview.prepare', () => {
  const prepare = linkRefSchema.preview?.prepare;

  it('prefers the link title', () => {
    expect(prepare?.({ title: 'Docs', label: 'Read the docs' })).toMatchObject({
      title: 'Docs',
    });
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
