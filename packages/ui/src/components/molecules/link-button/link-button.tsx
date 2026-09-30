import { A_AS_CONST, type IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { buttonVariants } from '@blog/ui/components/atoms/button/button-variants';
import type { ElementType } from 'react';
import type { VariantProps } from 'tailwind-variants';

type TLinkButtonOwnProps = IWithDataTestId &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

export type TLinkButtonProps<C extends ElementType = typeof A_AS_CONST> =
  TPolymorphicProps<C, TLinkButtonOwnProps>;

/** A navigation link that looks like a `Button`: applies the shared `buttonVariants` to an anchor (or any `as` element), so links can read as buttons. */
export const LinkButton = <C extends ElementType = typeof A_AS_CONST>({
  as,
  className,
  dataTestId,
  size,
  variant,
  ...rest
}: TLinkButtonProps<C>) => {
  const Component = as ?? A_AS_CONST;

  return (
    <Component
      className={buttonVariants({ variant, size, class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
