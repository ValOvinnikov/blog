import type { TMaybeUndefined } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@platform/lib/react';
import {
  cloneElement,
  type ElementType,
  Fragment,
  type ReactElement,
  useId,
} from 'react';

import { cardVariants } from './card-variants';
import { CardBody } from './components/body/card-body';
import { CardFooter } from './components/footer/card-footer';
import {
  CardHeader,
  type TCardHeaderProps,
} from './components/header/card-header';

const CardParts = {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
} satisfies Record<string, ElementType>;

type TCardProps = {
  id?: string;
  children?: TCompoundChildren<typeof CardParts>;
  className?: string;
  isDanger?: boolean;
  'aria-labelledby'?: string;
};

const CardRoot = ({
  id,
  children,
  className,
  isDanger = false,
  'aria-labelledby': ariaLabelledBy,
}: TCardProps) => {
  const { root } = cardVariants({ isDanger });
  const generatedTitleId = useId();
  const { slots, unmatched } = mapCompoundSlots(children, CardParts);
  const Header = slots.Header as TMaybeUndefined<
    ReactElement<TCardHeaderProps>
  >;
  const titleId = Header?.props.titleId ?? generatedTitleId;
  const labelledBy = ariaLabelledBy ?? (Header ? titleId : undefined);
  const Root = labelledBy ? 'section' : 'div';

  return (
    <Root
      id={id}
      data-slot="card"
      aria-labelledby={labelledBy}
      className={root({ class: className })}
    >
      {Header && cloneElement(Header, { titleId, isDanger })}
      {slots.Body}
      {slots.Footer}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </Root>
  );
};

export const Card: TCompoundComponent<typeof CardRoot, typeof CardParts> =
  Object.assign(CardRoot, CardParts);
