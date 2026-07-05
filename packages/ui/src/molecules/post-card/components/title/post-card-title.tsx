import { Size } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType, ReactNode } from 'react';

import { Heading } from '../../../../atoms/heading';
import { postCardTitleVariants } from './post-card-title-variants';

const s = postCardTitleVariants();

type TPostCardTitleOwnProps = {
  className?: string;
  children?: ReactNode;
};

export const PostCardTitle = <C extends ElementType = 'a'>({
  as,
  className,
  children,
  ...rest
}: TPolymorphicProps<C, TPostCardTitleOwnProps>) => {
  const Component = (as ?? 'a') as ElementType;
  return (
    <Component className={s.link({ class: className })} {...rest}>
      <Heading level={2} size={Size.SM} className={s.title()}>
        {children}
      </Heading>
    </Component>
  );
};
