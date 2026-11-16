'use client';

import type { TAsideKind } from '@shinefold/config';
import { Aside } from '@shinefold/ui/components/molecules/aside';
import { useHasDepthProvider } from '@web/context/depth-provider';
import type { ReactNode } from 'react';

import { deepAsideVariants } from './deep-aside-variants';

export interface IDeepAsideProps {
  kind: TAsideKind;
  label: string;
  children: ReactNode;
}

const s = deepAsideVariants();

export const DeepAside = ({ kind, label, children }: IDeepAsideProps) => {
  const hasDepthProvider = useHasDepthProvider();
  const aside = (
    <Aside kind={kind} label={label}>
      {children}
    </Aside>
  );

  if (!hasDepthProvider) return aside;

  return (
    <div className={s.root()} data-testid="deep-aside-gate">
      {aside}
    </div>
  );
};
