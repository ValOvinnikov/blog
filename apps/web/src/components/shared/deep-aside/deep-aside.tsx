'use client';

import type { TAsideKind } from '@blog/config';
import { Aside } from '@blog/ui/components/molecules/aside';
import { useHasDepthProvider } from '@web/context/depth-provider';
import type { ReactNode } from 'react';

import { deepAsideVariants } from './deep-aside-variants';

export interface IDeepAsideProps {
  kind: TAsideKind;
  label: string;
  children: ReactNode;
}

const s = deepAsideVariants();

/**
 * Inside a `DepthProvider` visibility is pure CSS, keyed off its
 * `data-depth` attribute, so the markup is identical at every depth.
 * Outside one there is no depth to follow and the aside always shows.
 */
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
