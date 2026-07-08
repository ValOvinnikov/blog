import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { buttonVariants } from '@blog/ui/atoms/button/button-variants';
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

export const LinkButton = <C extends ElementType = 'a'>({
  as,
  className,
  dataTestId,
  size,
  variant,
  ...rest
}: TLinkButtonProps<C>) => {
  const Component = (as ?? 'a') as ElementType;

  return (
    <Component
      className={buttonVariants({ variant, size, class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
