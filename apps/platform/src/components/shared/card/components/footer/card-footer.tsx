import { Alert } from '@platform/components/shared/alert';
import { cardVariants } from '@platform/components/shared/card/card-variants';
import { ALERT_TYPE } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import type { IWithClassName } from '@shinefold/config/types';

export type TCardFooterProps = IWithChildren &
  IWithClassName & {
    error?: string;
  };

export const CardFooter = ({
  children,
  error,
  className,
}: TCardFooterProps) => {
  const { footer, footerError } = cardVariants({
    hasFooterError: Boolean(error),
  });

  return (
    <div className={footer({ class: className })}>
      {error && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={error}
          className={footerError()}
        />
      )}
      {children}
    </div>
  );
};
