import { isInlineLinkPath, renameInlineLinkType } from './transform';

describe(isInlineLinkPath, () => {
  it('is true for a keyed element of settings_footer.social[]', () => {
    expect(isInlineLinkPath(['social', { _key: 'a1' }])).toBe(true);
  });

  it('is true for a keyed element of settings_navigation.items[]', () => {
    expect(isInlineLinkPath(['items', { _key: 'a1' }])).toBe(true);
  });

  it('is true for module_hero.secondaryAction', () => {
    expect(isInlineLinkPath(['secondaryAction'])).toBe(true);
  });

  it('is true for a ctaAction link inside module_cta.actions.actions[]', () => {
    expect(
      isInlineLinkPath(['actions', 'actions', { _key: 'a1' }, 'link']),
    ).toBe(true);
  });

  it('is true for a markDef annotation inside module_cta.content[]', () => {
    expect(
      isInlineLinkPath([
        'content',
        { _key: 'block1' },
        'markDefs',
        { _key: 'mark1' },
      ]),
    ).toBe(true);
  });

  it('is false for a richText/proseText markDefs annotation path (a different field name)', () => {
    expect(
      isInlineLinkPath([
        'body',
        { _key: 'block1' },
        'markDefs',
        { _key: 'mark1' },
      ]),
    ).toBe(false);
  });

  it('is false for a non-array, non-secondaryAction field', () => {
    expect(isInlineLinkPath(['title'])).toBe(false);
  });

  it('is false for a path nested deeper than the ctaAction link field itself', () => {
    expect(
      isInlineLinkPath(['actions', 'actions', { _key: 'a1' }, 'link', 'label']),
    ).toBe(false);
  });
});

describe(renameInlineLinkType, () => {
  it('renames a legacy link node in settings_footer.social[], preserving other fields', () => {
    const node = {
      _type: 'link',
      _key: 'a1',
      label: 'GitHub',
      platform: 'GITHUB',
      url: 'https://github.com',
      openInNewTab: true,
    };

    const result = renameInlineLinkType(node, ['social', { _key: 'a1' }]);

    expect(result).toEqual({ ...node, _type: 'inlineLink' });
  });

  it('renames a legacy link node at module_hero.secondaryAction', () => {
    const node = { _type: 'link', label: 'See more', url: '/blog' };

    const result = renameInlineLinkType(node, ['secondaryAction']);

    expect(result).toEqual({ ...node, _type: 'inlineLink' });
  });

  it('renames a legacy link node inside a ctaAction', () => {
    const node = { _type: 'link', label: 'Get started', url: '/signup' };

    const result = renameInlineLinkType(node, [
      'actions',
      'actions',
      { _key: 'a1' },
      'link',
    ]);

    expect(result).toEqual({ ...node, _type: 'inlineLink' });
  });

  it('renames a legacy link markDef annotation inside module_cta.content[]', () => {
    const node = { _type: 'link', _key: 'mark1', label: 'Docs', url: '/docs' };

    const result = renameInlineLinkType(node, [
      'content',
      { _key: 'block1' },
      'markDefs',
      { _key: 'mark1' },
    ]);

    expect(result).toEqual({ ...node, _type: 'inlineLink' });
  });

  it('is idempotent — a node already renamed to inlineLink is left alone', () => {
    const node = { _type: 'inlineLink', label: 'Already migrated' };

    const result = renameInlineLinkType(node, ['secondaryAction']);

    expect(result).toBeUndefined();
  });

  it('never touches a richText/proseText markDefs default link annotation (different field name)', () => {
    const node = { _type: 'link', _key: 'mark1', href: 'https://example.com' };

    const result = renameInlineLinkType(node, [
      'body',
      { _key: 'block1' },
      'markDefs',
      { _key: 'mark1' },
    ]);

    expect(result).toBeUndefined();
  });

  it('leaves unrelated object types at a known link path alone', () => {
    const node = { _type: 'socialLink', platform: 'X', url: 'https://x.com' };

    const result = renameInlineLinkType(node, ['social', { _key: 'a1' }]);

    expect(result).toBeUndefined();
  });
});
