import { Heading } from '@blog/ui/components/atoms/heading';

import { contactFormSuccessVariants } from './contact-form-success-variants';

export type TContactFormSuccessProps = {
  title: string;
  message: string;
};

export const ContactFormSuccess = ({
  title,
  message,
}: TContactFormSuccessProps) => {
  const s = contactFormSuccessVariants();

  return (
    <div role="status" className={s.root()}>
      <Heading level={3} visual="card">
        {title}
      </Heading>
      <p className={s.message()}>{message}</p>
    </div>
  );
};
