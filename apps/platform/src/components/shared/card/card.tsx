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
  children?: TCompoundChildren<typeof CardParts>;
  className?: string;
  'aria-labelledby'?: string;
};

const CardRoot = ({
  children,
  className,
  'aria-labelledby': ariaLabelledBy,
}: TCardProps) => {
  const { root } = cardVariants();
  const titleId = useId();
  const { slots, unmatched } = mapCompoundSlots(children, CardParts);
  const { Header } = slots;
  const labelledBy = ariaLabelledBy ?? (Header ? titleId : undefined);
  const Root = labelledBy ? 'section' : 'div';

  return (
    <Root
      data-slot="card"
      aria-labelledby={labelledBy}
      className={root({ class: className })}
    >
      {Header &&
        cloneElement(Header as ReactElement<TCardHeaderProps>, { titleId })}
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
