import { Heading } from '@admin/components/shared/heading';
import {
  Children,
  isValidElement,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cardVariants } from './card-variants';

type TCardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned, e.g. a button or menu trigger. */
  actions?: ReactNode;
  className?: string;
};

const CardHeader = ({
  title,
  description,
  actions,
  className,
}: TCardHeaderProps) => {
  const { header, headerTitleGroup, headerDescription, headerActions } =
    cardVariants();

  return (
    <div className={header({ class: className })}>
      <div className={headerTitleGroup()}>
        <Heading level={3} size="cardTitle">
          {title}
        </Heading>
        {description && (
          <span className={headerDescription()}>{description}</span>
        )}
      </div>
      {actions && <div className={headerActions()}>{actions}</div>}
    </div>
  );
};

type TCardBodyProps = {
  children: ReactNode;
  className?: string;
};

const CardBody = ({ children, className }: TCardBodyProps) => {
  const { body } = cardVariants();

  return <div className={body({ class: className })}>{children}</div>;
};

type TCardFooterProps = {
  children: ReactNode;
  className?: string;
};

const CardFooter = ({ children, className }: TCardFooterProps) => {
  const { footer } = cardVariants();

  return <div className={footer({ class: className })}>{children}</div>;
};

const CardParts = {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
} satisfies Record<string, ElementType>;

type TCardSlots = {
  [K in keyof typeof CardParts]?: ReactElement;
};

/** Resolves `Card`'s children against its known `Header`/`Body`/`Footer` slots, independent of JSX order. */
const mapCardSlots = (
  children: ReactNode,
): { slots: TCardSlots; unmatched: ReactNode[] } => {
  const pairs = Object.entries(CardParts) as [
    keyof typeof CardParts,
    ElementType,
  ][];
  const slots: TCardSlots = {};
  const unmatched: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      if (child != null && child !== false) unmatched.push(child);
      return;
    }
    const match = pairs.find(
      ([key, Component]) =>
        child.type === Component && slots[key] === undefined,
    );
    if (match) slots[match[0]] = child;
    else unmatched.push(child);
  });

  return { slots, unmatched };
};

export type TCardProps = {
  children?: ReactNode;
  className?: string;
};

const CardRoot = ({ children, className }: TCardProps) => {
  const { root } = cardVariants();
  const { slots, unmatched } = mapCardSlots(children);

  return (
    <div className={root({ class: className })}>
      {slots.Header}
      {slots.Body}
      {slots.Footer}
      {unmatched}
    </div>
  );
};

export const Card = Object.assign(CardRoot, CardParts);
