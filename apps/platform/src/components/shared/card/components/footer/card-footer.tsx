import { ALERT_TYPE } from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import type { IWithClassName } from '@blog/config/types';
import { Alert } from '@platform/components/shared/alert';
import { cardVariants } from '@platform/components/shared/card/card-variants';

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
