import { ICONS, SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Icon } from '@blog/ui/components/atoms/icon';
import type { ReactNode } from 'react';

import { signInPanelSentVariants } from './sign-in-panel-sent-variants';

type TSignInPanelSentProps = {
  title: ReactNode;
  message: ReactNode;
  resetLabel: string;
  onReset: () => void;
};

/** What replaces the sign-in form once the link is on its way: where it went, and a way to start over with another address. */
export const SignInPanelSent = ({
  title,
  message,
  resetLabel,
  onReset,
}: TSignInPanelSentProps) => {
  const s = signInPanelSentVariants();

  return (
    <>
      <span className={s.badge()}>
        <Icon name={ICONS.MAIL} size={SIZE.MD} />
      </span>
      {title}
      <p role="status" className={s.message()}>
        {message}
      </p>
      <Button
        variant="link"
        size={SIZE.SM}
        onClick={onReset}
        className={s.reset()}
      >
        {resetLabel}
      </Button>
    </>
  );
};
