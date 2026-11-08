import type { IWithChildren } from '@blog/config/react';
import type { TPortableTextBody } from '@blog/service';
import { hasLength } from '@blog/utils/primitives';
import { extractContentsHeadings } from '@web/utils/extract-contents-headings';
import type { ReactNode } from 'react';

import { ContentsRail } from './components/contents-rail/contents-rail';
import { contentsRailLayoutVariants } from './contents-rail-layout-variants';

interface IContentsRailLayoutProps extends IWithChildren {
  body: TPortableTextBody;
  footer?: ReactNode;
}

export const ContentsRailLayout = ({
  body,
  footer,
  children,
}: IContentsRailLayoutProps) => {
  const headings = extractContentsHeadings(body);
  const hasRail = hasLength(headings);
  const s = contentsRailLayoutVariants({ hasRail });

  return (
    <div className={s.root()}>
      {hasRail && <ContentsRail className={s.rail()} headings={headings} />}
      <div className={s.content()}>{children}</div>
      {footer && <div className={s.footer()}>{footer}</div>}
    </div>
  );
};
