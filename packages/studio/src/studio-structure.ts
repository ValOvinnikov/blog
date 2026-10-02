import type { TLocaleIsoCode } from '@blog/config/constants';
import { buildSections } from '@blog/studio/structure/build-section/build-section';
import { sections } from '@blog/studio/structure/sections';
import type { StructureResolver } from 'sanity/structure';

export const createStudioStructure =
  (locales: readonly TLocaleIsoCode[]): StructureResolver =>
  (S) =>
    S.list()
      .title('Content')
      .items(buildSections(S, sections, locales));
