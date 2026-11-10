import {
  NEWSLETTER_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import type { ReactNode } from 'react';

export type TNewsletterSignupCompactProps = IWithClassName &
  IWithDataTestId & {
    align?: TNewsletterSignupVariants['align'];
    children: ReactNode;
  };

/** A single-row strip that holds its `NewsletterSignup.Form`. */
export const NewsletterSignupCompact = ({
  align,
  children,
  className,
  dataTestId,
}: TNewsletterSignupCompactProps) => {
  const s = newsletterSignupVariants({
    variant: NEWSLETTER_VARIANT.COMPACT,
    align,
  });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      {children}
    </div>
  );
};
