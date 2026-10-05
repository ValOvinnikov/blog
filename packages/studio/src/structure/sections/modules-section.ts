import { heroSchema } from '@blog/studio/schema-types/modules/hero/hero';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { heroProfileSchema } from '@blog/studio/schema-types/modules/hero-profile/hero-profile';
import { heroStatementSchema } from '@blog/studio/schema-types/modules/hero-statement/hero-statement';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { moduleKinds } from '@blog/studio/structure/module-kinds/module-kinds';
import { Blocks } from 'lucide-react';

export const modulesSection: TStructureSection = {
  title: 'Modules',
  id: 'modules',
  icon: Blocks,
  groups: [
    {
      title: 'Heroes',
      items: [
        { schema: heroBlogSchema },
        { schema: heroStatementSchema },
        { schema: heroProfileSchema },
        { schema: heroSchema },
      ],
    },
    ...moduleKinds.map(({ title, modules }) => ({
      title,
      items: modules.map((schema) => ({ schema })),
    })),
  ],
};
