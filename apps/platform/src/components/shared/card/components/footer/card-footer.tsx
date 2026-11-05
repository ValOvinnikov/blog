import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { cardVariants } from '@platform/components/shared/card/card-variants';
import type { ReactNode } from 'react';

export type TCardFooterProps = {
  children: ReactNode;
  error?: string;
  className?: string;
};

export const CardFooter = ({
  children,
  error,
  className,
}: TCardFooterProps) => {
  const { footer, footerError } = cardVariants();

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
