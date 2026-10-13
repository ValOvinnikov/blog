import { footerSettingsSchema } from '@blog/studio/schema-types/documents/settings/footer/footer';
import { navigationSettingsSchema } from '@blog/studio/schema-types/documents/settings/navigation/navigation';
import { siteSettingsSchema } from '@blog/studio/schema-types/documents/settings/site-settings/site-settings';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Settings } from 'lucide-react';

export const settingsSection: TStructureSection = {
  title: 'Settings',
  id: 'settings',
  icon: Settings,
  dividerBefore: true,
  groups: [
    {
      items: [
        { schema: navigationSettingsSchema, mode: 'singleton' },
        { schema: footerSettingsSchema, mode: 'singleton' },
      ],
    },
    {
      dividerBefore: true,
      items: [{ schema: siteSettingsSchema, mode: 'singleton' }],
    },
  ],
};
