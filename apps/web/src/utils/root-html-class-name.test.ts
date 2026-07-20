import { BRAND_VARIANTS } from '@blog/config';
import { describe, expect, it } from 'vitest';

import { buildRootHtmlClassName } from './root-html-class-name';

const BASE_CLASS_NAME = 'font-a font-b font-c';

describe('buildRootHtmlClassName', () => {
  it('renders only the base className for the Console variant', () => {
    expect(
      buildRootHtmlClassName(BASE_CLASS_NAME, BRAND_VARIANTS.CONSOLE),
    ).toBe(BASE_CLASS_NAME);
  });

  it('renders only the base className when the variant is unresolved', () => {
    expect(buildRootHtmlClassName(BASE_CLASS_NAME)).toBe(BASE_CLASS_NAME);
  });

  it('appends brand-indigo for the Indigo variant', () => {
    expect(buildRootHtmlClassName(BASE_CLASS_NAME, BRAND_VARIANTS.INDIGO)).toBe(
      `${BASE_CLASS_NAME} brand-indigo`,
    );
  });
});
