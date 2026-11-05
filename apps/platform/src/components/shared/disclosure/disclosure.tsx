'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import { ICONS } from '@blog/config';
import {
  HEADING_TAGS,
  type THeadingLevel,
} from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import type { ReactNode } from 'react';

import {
  DISCLOSURE_CHEVRON_SIZE,
  disclosureVariants,
  type TDisclosureVariants,
} from './disclosure-variants';

type TDisclosureHeading = {
  level: Exclude<THeadingLevel, 1>;
  id?: string;
};

type TDisclosureOpenState = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

type TDisclosureCollapsedBody = {
  id: string;
  content: ReactNode;
};

type TDisclosureBaseProps = {
  summary: ReactNode;
  children: ReactNode;
  variant?: TDisclosureVariants['variant'];
  heading?: TDisclosureHeading;
  className?: string;
};

export type TDisclosureProps = TDisclosureBaseProps &
  (
    | { openState?: TDisclosureOpenState; collapsedBody?: never }
    | {
        openState: TDisclosureOpenState;
        collapsedBody: TDisclosureCollapsedBody;
      }
  );

export const Disclosure = ({
  summary,
  children,
  variant = 'card',
  heading,
  openState,
  collapsedBody,
  className,
}: TDisclosureProps) => {
  const { root, trigger, chevron, inner } = disclosureVariants({ variant });
  const isOpen = openState?.isOpen;

  const triggerButton = (
    <Collapsible.Trigger
      className={trigger()}
      aria-controls={collapsedBody?.id}
    >
      {summary}
      <Icon
        name={ICONS.CHEVRON_RIGHT}
        size={DISCLOSURE_CHEVRON_SIZE[variant]}
        className={chevron()}
      />
    </Collapsible.Trigger>
  );
  const HeadingTag = heading ? HEADING_TAGS[heading.level] : undefined;

  return (
    <Collapsible.Root
      className={root({ class: className })}
      open={isOpen}
      onOpenChange={(nextOpen) => openState?.onOpenChange(nextOpen)}
    >
      {HeadingTag ? (
        <HeadingTag id={heading?.id}>{triggerButton}</HeadingTag>
      ) : (
        triggerButton
      )}
      {collapsedBody ? (
        <div id={collapsedBody.id} className={inner()}>
          {isOpen ? children : collapsedBody.content}
        </div>
      ) : (
        <Collapsible.Panel keepMounted={true} className={inner()}>
          {children}
        </Collapsible.Panel>
      )}
    </Collapsible.Root>
  );
};
