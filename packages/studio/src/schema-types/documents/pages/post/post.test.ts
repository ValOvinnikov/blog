import { postPageSchema } from '@blog/studio/schema-types/documents/pages/post/post';

describe('postPageSchema preview', () => {
  const prepare = postPageSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected postPageSchema to define preview.prepare.');
  }

  it.each([
    [
      {
        heading: 'Understanding GROQ',
        title: 'Wrapper Label',
        author: 'Jane Doe',
        media: undefined,
      },
      {
        title: 'Understanding GROQ',
        subtitle: 'by Jane Doe',
        media: undefined,
      },
    ],
    [
      {
        heading: undefined,
        title: 'Wrapper Label',
        author: 'Jane Doe',
        media: undefined,
      },
      { title: 'Wrapper Label', subtitle: 'by Jane Doe', media: undefined },
    ],
    [
      {
        heading: undefined,
        title: undefined,
        author: undefined,
        media: undefined,
      },
      { title: 'Unknown', subtitle: '', media: undefined },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
