import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { makeEnTranslator } from '@platform/testing/en-translator';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';

export const tNavSections = makeEnTranslator('navSections');

export const NO_PLAN_PAGE: TPlanPageAccess = {
  languages: false,
  email: false,
  leads: false,
  subscribers: false,
  comments: false,
  team: false,
};

export const CONFIGURATION_KEYS = [
  'look',
  'voice',
  'features',
  'leads',
  'languages',
  'domain',
  'email',
  'subscribers',
  'comments',
  'team',
];
export const COMING_SOON_KEYS = ['subscribers', 'comments', 'team'];
export const ALWAYS_AVAILABLE_KEYS = ['look', 'voice', 'features', 'domain'];
export const MOCK_UNREAD_LEADS_COUNT = 3;

export const translated = (keys: string[]) =>
  keys.map((key) => tNavSections(key));
export const labelsOf = (section: TSidebarNavSection) =>
  section.items.map((item) => item.label);
export const itemKeyed = (section: TSidebarNavSection, key: string) =>
  section.items.find((item) => item.label === tNavSections(key));
