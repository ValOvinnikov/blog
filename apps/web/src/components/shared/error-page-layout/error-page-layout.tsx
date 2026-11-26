import { TEXT_ROLE, type TMaybeNull } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import type { ReactNode, RefObject } from 'react';

import { errorPageLayoutVariants } from './error-page-layout-variants';

const s = errorPageLayoutVariants();

interface IErrorPageLayoutProps extends IWithChildren {
  title: string;
  actions: ReactNode;
  mainRef: RefObject<TMaybeNull<HTMLElement>>;
  announcementRef: RefObject<TMaybeNull<HTMLSpanElement>>;
}

export const ErrorPageLayout = ({
  title,
  actions,
  mainRef,
  announcementRef,
  children,
}: IErrorPageLayoutProps) => (
  <main ref={mainRef} tabIndex={-1} className={s.root()}>
    <span
      ref={announcementRef}
      aria-live="assertive"
      aria-atomic="true"
      className={s.announcement()}
    />
    <Heading level={1} visual={TEXT_ROLE.HERO_TITLE}>
      {title}
    </Heading>
    <Text textRole={TEXT_ROLE.INTRO} className={s.copy()}>
      {children}
    </Text>
    <div className={s.actions()}>{actions}</div>
  </main>
);
