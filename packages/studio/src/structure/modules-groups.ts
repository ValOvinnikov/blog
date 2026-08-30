import { contentSchema } from '@blog/studio/schema-types/modules/module-content';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { heroSchema } from '@blog/studio/schema-types/modules/module-hero';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import type { TStructureGroup } from '@blog/studio/structure/build-grouped-list';
import {
  Clock,
  FileText,
  LayoutGrid,
  List,
  Mail,
  Megaphone,
  Sparkles,
} from 'lucide-react';

export const modulesGroups: TStructureGroup[] = [
  {
    title: 'Post modules',
    items: [
      { documentType: postListSchema.name, title: 'Post Lists', icon: List },
      {
        documentType: postLatestSchema.name,
        title: 'Post Latest',
        icon: Clock,
      },
      {
        documentType: taxonomyListSchema.name,
        title: 'Taxonomy Lists',
        icon: LayoutGrid,
      },
    ],
  },
  {
    title: 'Content modules',
    items: [
      { documentType: heroSchema.name, title: 'Heroes', icon: Sparkles },
      { documentType: contentSchema.name, title: 'Content', icon: FileText },
      { documentType: ctaSchema.name, title: 'CTAs', icon: Megaphone },
      {
        documentType: newsletterSchema.name,
        title: 'Newsletter Signups',
        icon: Mail,
      },
    ],
  },
];
