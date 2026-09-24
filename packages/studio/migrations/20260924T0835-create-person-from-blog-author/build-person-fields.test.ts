import { buildPersonFields } from './build-person-fields';

describe(buildPersonFields, () => {
  const idMap = new Map<string, string>();

  it('carries every blog_author field across unchanged', () => {
    const author = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: { _type: 'imageWithAlt', alt: 'Jane' },
      bio: [{ _type: 'block' }],
      role: 'Senior Engineer',
      socialLinks: [{ _type: 'socialProfile', url: 'https://example.com' }],
      profilePage: { _type: 'reference', _ref: 'link-1' },
    };

    expect(buildPersonFields(author, idMap)).toEqual({
      name: 'Jane Doe',
      image: { _type: 'imageWithAlt', alt: 'Jane' },
      bio: [{ _type: 'block' }],
      role: 'Senior Engineer',
      socialLinks: [{ _type: 'socialProfile', url: 'https://example.com' }],
      profilePage: { _type: 'reference', _ref: 'link-1' },
    });
  });

  it('leaves an unrelated reference (e.g. profilePage) untouched by the author id map', () => {
    const author = {
      _id: 'author-1',
      name: 'Jane Doe',
      profilePage: { _type: 'reference', _ref: 'link-1' },
    };

    const fields = buildPersonFields(
      author,
      new Map([['author-1', 'person-author-1']]),
    );

    expect(fields.profilePage).toEqual({
      _type: 'reference',
      _ref: 'link-1',
    });
  });
});
