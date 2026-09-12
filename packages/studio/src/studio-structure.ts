import { buildSections } from '@blog/studio/structure/build-section/build-section';
import { sections } from '@blog/studio/structure/sections';
import type { StructureResolver } from 'sanity/structure';

/** The desk structure shared by every Studio entry point (CLI + mount component). */
export const studioStructure: StructureResolver = (S) =>
  S.list().title('Content').items(buildSections(S, sections));
