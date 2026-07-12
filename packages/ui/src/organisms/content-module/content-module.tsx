import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { contentModuleVariants } from './content-module-variants';

export interface IContentModuleProps
  extends
    Omit<ComponentPropsWithoutRef<'section'>, 'children' | 'title'>,
    IWithDataTestId {
  title?: string;
  titleId?: string;
  children: ReactNode;
}

/**
 * ContentModule — page-builder organism rendering a portable-text content
 * block behind an optional heading. The web layer owns Portable Text
 * rendering and passes the rendered node as `children`.
 */
export const ContentModule = ({
  title,
  titleId,
  children,
  className,
  dataTestId,
  ...rest
}: IContentModuleProps) => {
  const s = contentModuleVariants();

  return (
    <section
      aria-labelledby={title && titleId ? titleId : undefined}
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {title && (
        <h2 id={titleId} className={s.heading()}>
          {title}
        </h2>
      )}
      <div className={s.body()}>{children}</div>
    </section>
  );
};
