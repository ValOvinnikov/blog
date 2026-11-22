import type {
  Block_feature,
  Block_testimonial,
  Module_featureHighlights,
  Module_featureList,
  Module_logoWall,
  Module_pricing,
  Module_stats,
  Module_team,
  Module_testimonial,
  Module_timeline,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterModule } from './starter-document';
import type { TStarterDocument } from './starter-document-shape';

export type TGrowthDocumentUnion =
  | TStarterModule<Module_timeline>
  | TStarterModule<Module_featureList>
  | TStarterModule<Module_featureHighlights>
  | TStarterModule<Module_logoWall>
  | TStarterModule<Module_pricing>
  | TStarterModule<Module_stats>
  | TStarterModule<Module_testimonial>
  | TStarterModule<Module_team>
  | TStarterDocument<Block_feature, 'title' | 'headingBlock'>
  | TStarterDocument<Block_testimonial, 'title' | 'name' | 'quote'>;
