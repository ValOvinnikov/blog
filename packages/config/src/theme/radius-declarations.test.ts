import { HEADER_CONTROL_SHAPE_DECLARATIONS } from './header-control-shape-declarations';
import { RADIUS_DECLARATIONS } from './radius-declarations';
import { BUTTON_SHAPE_DECLARATIONS } from './theme-declarations';

const LENGTH_OR_EXPRESSION = /^(\d+(\.\d+)?(px|rem|em)|(max|var)\(.+\))$/;

const declarationTables = {
  RADIUS_DECLARATIONS,
  BUTTON_SHAPE_DECLARATIONS,
  HEADER_CONTROL_SHAPE_DECLARATIONS,
};

const declarations = Object.entries(declarationTables).flatMap(
  ([table, byOption]) =>
    Object.entries(byOption).flatMap(([option, properties]) =>
      Object.entries(properties).map(([property, value]) => ({
        label: `${table}.${option} ${property}`,
        value,
      })),
    ),
);

describe('radius declarations', () => {
  it.each(declarations)(
    '$label is a length with a unit or a max()/var() expression',
    ({ value }) => {
      expect(value).toMatch(LENGTH_OR_EXPRESSION);
    },
  );
});
