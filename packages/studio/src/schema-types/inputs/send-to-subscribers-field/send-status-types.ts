import type { CardTone } from '@sanity/ui';
import type { ComponentType } from 'react';

export type TSendStatusLink = { href: string; label: string };

export type TSendStatusView = {
  tone: Extract<CardTone, 'positive' | 'critical' | 'transparent'>;
  icon?: ComponentType;
  lead?: string;
  detail: string;
  link?: TSendStatusLink;
};
