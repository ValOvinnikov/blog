import { isLayoutFieldPath, widenModuleLayoutType } from './transform';

describe(isLayoutFieldPath, () => {
  it('is true for the top-level layout field', () => {
    expect(isLayoutFieldPath(['layout'])).toBe(true);
  });

  it('is false for a path nested deeper than the field itself', () => {
    expect(isLayoutFieldPath(['layout', 'containerWidth'])).toBe(false);
  });

  it('is false for an unrelated field named something else', () => {
    expect(isLayoutFieldPath(['heroImage'])).toBe(false);
  });
});

describe(widenModuleLayoutType, () => {
  it('retypes a legacy layout field to wideLayout, preserving other fields', () => {
    const node = {
      _type: 'layout',
      spacingTop: 'MD',
      containerWidth: 'WIDE',
      dividerTop: true,
    };

    const result = widenModuleLayoutType(node, ['layout']);

    expect(result).toEqual({ ...node, _type: 'wideLayout' });
  });

  it('is idempotent — a node already retyped to wideLayout is left alone', () => {
    const node = { _type: 'wideLayout', spacingTop: 'MD' };

    const result = widenModuleLayoutType(node, ['layout']);

    expect(result).toBeUndefined();
  });

  it('never touches a layout node outside the layout field path', () => {
    const node = { _type: 'layout', spacingTop: 'MD' };

    const result = widenModuleLayoutType(node, ['heroImage']);

    expect(result).toBeUndefined();
  });

  it('leaves unrelated object types at the layout path alone', () => {
    const node = { _type: 'heroLayout', spacingTop: 'MD' };

    const result = widenModuleLayoutType(node, ['layout']);

    expect(result).toBeUndefined();
  });
});
