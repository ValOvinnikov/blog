import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@platform/lib/react';
import { Fragment, type ElementType } from 'react';

import { cardVariants } from './card-variants';
import { CardBody } from './components/body/card-body';
import { CardFooter } from './components/footer/card-footer';
import { CardHeader } from './components/header/card-header';

const CardParts = {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
} satisfies Record<string, ElementType>;

type TCardProps = {
  children?: TCompoundChildren<typeof CardParts>;
  className?: string;
};

const CardRoot = ({ children, className }: TCardProps) => {
  const { root } = cardVariants();
  const { slots, unmatched } = mapCompoundSlots(children, CardParts);

  return (
    <div className={root({ class: className })}>
      {slots.Header}
      {slots.Body}
      {slots.Footer}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  );
};

export const Card: TCompoundComponent<typeof CardRoot, typeof CardParts> =
  Object.assign(CardRoot, CardParts);
