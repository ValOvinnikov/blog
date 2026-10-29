import { FOOTER_LAYOUT, type TFooterLayout } from '@blog/config';
import { hasSlotContent } from '@blog/ui/lib/react';
import { isValidElement, type PropsWithChildren, type ReactNode } from 'react';

import { hasGroupItems } from './components/groups/has-group-items';

export type TFooterSlot =
  | 'Logo'
  | 'About'
  | 'Address'
  | 'Social'
  | 'Groups'
  | 'Wordmark'
  | 'Copyright'
  | 'FinePrint'
  | 'Nav';

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
  isValidElement<PropsWithChildren>(groups) &&
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
