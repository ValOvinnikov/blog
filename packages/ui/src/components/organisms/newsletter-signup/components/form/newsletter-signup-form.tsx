import { FORM_STATUS } from '@blog/config';
import type { TNewsletterSignupFormState } from '@blog/ui/components/organisms/newsletter-signup/components/form/newsletter-signup-form-state';
import { NewsletterSignupInput } from '@blog/ui/components/organisms/newsletter-signup/components/input/newsletter-signup-input';
import { NewsletterSignupStatus } from '@blog/ui/components/organisms/newsletter-signup/components/status/newsletter-signup-status';
import { NewsletterSignupSubmit } from '@blog/ui/components/organisms/newsletter-signup/components/submit/newsletter-signup-submit';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { mapCompoundSlots, type TCompoundChildren } from '@blog/ui/lib/react';
import {
  cloneElement,
  Fragment,
  useId,
  type ElementType,
  type SubmitEvent,
} from 'react';

const NewsletterSignupFormParts = {
  Input: NewsletterSignupInput,
  Submit: NewsletterSignupSubmit,
  Status: NewsletterSignupStatus,
} satisfies Record<string, ElementType>;

export type TNewsletterSignupFormProps = Omit<
  TNewsletterSignupFormState,
  'errorId'
> & {
  onSubmit: () => void;
  children?: TCompoundChildren<typeof NewsletterSignupFormParts>;
};

/** A controlled subscribe form that lays out its `Input`, `Submit` and `Status` parts, and gives way to the success message once subscribed. */
export const NewsletterSignupForm = ({
  onSubmit,
  children,
  ...formState
}: TNewsletterSignupFormProps) => {
  const errorId = useId();
  const { slots, unmatched } = mapCompoundSlots(
    children,
    NewsletterSignupFormParts,
  );
  const { status, variant } = formState;
  const hasError =
    status === FORM_STATUS.ERROR && Boolean(slots.Status?.props.errorMessage);
  const state = { ...formState, errorId: hasError ? errorId : undefined };

  const unmatchedNodes = unmatched.map((node, i) => (
    <Fragment key={i}>{node}</Fragment>
  ));

  if (status === FORM_STATUS.SUCCESS) {
    return (
      <>
        {slots.Status && cloneElement(slots.Status, { state })}
        {unmatchedNodes}
      </>
    );
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      className={newsletterSignupVariants({ variant }).form()}
      onSubmit={handleSubmit}
      noValidate={true}
    >
      {slots.Input && cloneElement(slots.Input, { state })}
      {slots.Submit && cloneElement(slots.Submit, { state })}
      {slots.Status && cloneElement(slots.Status, { state })}
      {unmatchedNodes}
    </form>
  );
};
