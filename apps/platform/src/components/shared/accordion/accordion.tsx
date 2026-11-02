'use client';

import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import type { IWithClassName } from '@blog/config';
import { AccordionItem } from '@platform/components/shared/accordion/components/item/accordion-item';
import { AccordionNote } from '@platform/components/shared/accordion/components/note/accordion-note';
import { AccordionPanel } from '@platform/components/shared/accordion/components/panel/accordion-panel';
import { AccordionTrigger } from '@platform/components/shared/accordion/components/trigger/accordion-trigger';
import {
  ACCORDION_VARIANT,
  type TAccordionVariant,
} from '@platform/constants/accordion';
import type { TCompoundComponent } from '@platform/lib/react';
import { useMemo, type ElementType, type ReactNode, type Ref } from 'react';

import { AccordionContext } from './accordion-context';
import { accordionVariants } from './accordion-variants';
import {
  useAccordionActions,
  type TAccordionActions,
} from './use-accordion-actions';
import {
  useAccordionOpenValues,
  type TAccordionOpenProps,
} from './use-accordion-open-values';

const AccordionParts = {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Note: AccordionNote,
  Panel: AccordionPanel,
} satisfies Record<string, ElementType>;

type TAccordionProps<TValue extends string> = TAccordionOpenProps<TValue> &
  IWithClassName & {
    variant?: TAccordionVariant;
    actionsRef?: Ref<TAccordionActions<TValue>>;
    children: ReactNode;
  };

const AccordionRoot = <TValue extends string>(
  props: TAccordionProps<TValue>,
) => {
  const {
    variant = ACCORDION_VARIANT.LIST,
    actionsRef,
    children,
    className,
  } = props;
  const { isMultiple, openValues, setOpenValues } =
    useAccordionOpenValues(props);
  const registerButton = useAccordionActions(
    actionsRef,
    openValues,
    setOpenValues,
  );
  const context = useMemo(
    () => ({ variant, openValues, registerButton }),
    [variant, openValues, registerButton],
  );

  return (
    <AccordionContext.Provider value={context}>
      <BaseAccordion.Root<TValue>
        multiple={isMultiple}
        value={[...openValues]}
        onValueChange={(next) => setOpenValues([...next])}
        className={accordionVariants({ variant }).root({ class: className })}
      >
        {children}
      </BaseAccordion.Root>
    </AccordionContext.Provider>
  );
};

export const Accordion: TCompoundComponent<
  typeof AccordionRoot,
  typeof AccordionParts
> = Object.assign(AccordionRoot, AccordionParts);
