import { CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config/constants';

import { isLayoutFieldPath, widenModuleLayoutType } from './transform';

const MOCK_LAYOUT_PATH = ['layout'];
const MOCK_OTHER_FIELD_PATH = ['heroImage'];

describe(isLayoutFieldPath, () => {
  it.each([
    { path: MOCK_LAYOUT_PATH, expected: true },
    { path: ['layout', 'containerWidth'], expected: false },
    { path: MOCK_OTHER_FIELD_PATH, expected: false },
  ])('returns $expected for the path $path', ({ path, expected }) => {
    expect(isLayoutFieldPath(path)).toBe(expected);
  });
});

describe(widenModuleLayoutType, () => {
  it('retypes a legacy layout field to wideLayout, preserving other fields', () => {
    const node = {
      _type: 'layout',
      spacingTop: SPACING_SCALE.MD,
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: true,
    };

    const result = widenModuleLayoutType(node, MOCK_LAYOUT_PATH);

    expect(result).toEqual({ ...node, _type: 'wideLayout' });
  });

  it.each([
    {
      title: 'a node already retyped to wideLayout',
      node: { _type: 'wideLayout', spacingTop: SPACING_SCALE.MD },
      path: MOCK_LAYOUT_PATH,
    },
    {
      title: 'a layout node outside the layout field path',
      node: { _type: 'layout', spacingTop: SPACING_SCALE.MD },
      path: MOCK_OTHER_FIELD_PATH,
    },
    {
      title: 'an unrelated object type at the layout path',
      node: { _type: 'heroLayout', spacingTop: SPACING_SCALE.MD },
      path: MOCK_LAYOUT_PATH,
    },
  ])('leaves $title alone', ({ node, path }) => {
    const result = widenModuleLayoutType(node, path);

    expect(result).toBeUndefined();
  });
});
