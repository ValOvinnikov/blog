import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { buttonVariants } from '@blog/ui/atoms/button/button-variants';
import { resolveComponent } from '@blog/ui/lib/react';
import type { ElementType } from 'react';
import type { VariantProps } from 'tailwind-variants';

type TLinkButtonOwnProps = IWithDataTestId &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export type TLinkButtonProps<C extends ElementType = 'a'> = TPolymorphicProps<
  C,
  TLinkButtonOwnProps
>;

/**
 * LinkButton — a navigation link that looks like a `Button`: applies the shared
 * `buttonVariants` to an anchor (or any `as` element), so links can read as
 * buttons. Polymorphic via `as`, defaulting to `<a>`.
 */
export const LinkButton = <C extends ElementType = 'a'>({
  as,
  className,
  dataTestId,
  size,
  variant,
  ...rest
}: TLinkButtonProps<C>) => {
  const Component = resolveComponent(as, 'a');

  return (
    // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `as`/fallback verbatim, so the reference stays stable across renders
    <Component
      className={buttonVariants({ variant, size, class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
