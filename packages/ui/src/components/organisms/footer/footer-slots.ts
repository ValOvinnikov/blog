import { FOOTER_LAYOUT, type TFooterLayout } from '@blog/config';
import { hasSlotContent } from '@blog/ui/lib/react';
import { isValidElement, type ElementType, type ReactNode } from 'react';

import { FooterAbout } from './components/about/footer-about';
import { FooterAddress } from './components/address/footer-address';
import { FooterCopyright } from './components/copyright/footer-copyright';
import { FooterFinePrint } from './components/fine-print/footer-fine-print';
import { FooterGroups } from './components/groups/footer-groups';
import { hasGroupItems } from './components/groups/has-group-items';
import { FooterLogo } from './components/logo/footer-logo';
import { FooterNav } from './components/nav/footer-nav';
import { FooterSocial } from './components/social/footer-social';
import { FooterWordmark } from './components/wordmark/footer-wordmark';

export const FooterSlotParts = {
  Logo: FooterLogo,
  About: FooterAbout,
  Address: FooterAddress,
  Social: FooterSocial,
  Groups: FooterGroups,
  Wordmark: FooterWordmark,
  Copyright: FooterCopyright,
  FinePrint: FooterFinePrint,
  Nav: FooterNav,
} satisfies Record<string, ElementType>;

type TFooterSlot = keyof typeof FooterSlotParts;

export const BRAND_SLOTS: readonly TFooterSlot[] = [
  'Logo',
  'About',
  'Address',
  'Social',
];
export const BOTTOM_SLOTS: readonly TFooterSlot[] = [
  'Copyright',
  'FinePrint',
  'Nav',
];
const FULL_SLOTS = [...BRAND_SLOTS, 'Groups', ...BOTTOM_SLOTS] as const;

export const LAYOUT_SLOTS: Record<TFooterLayout, readonly TFooterSlot[]> = {
  [FOOTER_LAYOUT.COLUMNS]: FULL_SLOTS,
  [FOOTER_LAYOUT.CENTRED]: FULL_SLOTS,
  [FOOTER_LAYOUT.COMPACT]: ['Social', ...BOTTOM_SLOTS],
  [FOOTER_LAYOUT.BIG_WORDMARK]: [...FULL_SLOTS, 'Wordmark'],
};

const hasGroupsContent = (groups: ReactNode) =>
  isValidElement<{ children?: ReactNode }>(groups) &&
  hasGroupItems(groups.props.children);

export const SLOT_HAS_CONTENT: Record<
  TFooterSlot,
  (slot: ReactNode) => boolean
> = {
  Logo: hasSlotContent,
  About: hasSlotContent,
  Address: hasSlotContent,
  Social: hasSlotContent,
  Groups: hasGroupsContent,
  Wordmark: hasSlotContent,
  Copyright: isValidElement,
  FinePrint: hasSlotContent,
  Nav: hasSlotContent,
};
