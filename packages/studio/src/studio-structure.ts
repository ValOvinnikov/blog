import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { buildSections } from '@shinefold/studio/structure/build-section/build-section';
import { sections } from '@shinefold/studio/structure/sections';
import type { StructureResolver } from 'sanity/structure';

export const createStudioStructure =
  (locales: readonly TLocaleIsoCode[]): StructureResolver =>
  (S) =>
    S.list()
      .title('Content')
      .items(buildSections(S, sections, locales));
