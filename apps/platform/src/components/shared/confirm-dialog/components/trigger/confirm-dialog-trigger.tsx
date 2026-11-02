import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from '@platform/components/shared/button';
import type { TButtonVariants } from '@platform/components/shared/button/button-variants';
import { useConfirmDialogContext } from '@platform/components/shared/confirm-dialog/confirm-dialog-context';
import { Text } from '@platform/components/shared/text';
import { useId, type ReactNode } from 'react';

export type TConfirmDialogTriggerProps = {
  children: ReactNode;
  disabledReason?: string;
  size?: TButtonVariants['size'];
  focusGround?: TButtonVariants['focusGround'];
  ariaLabel?: string;
};

export const ConfirmDialogTrigger = ({
  children,
  disabledReason,
  size,
  focusGround,
  ariaLabel,
}: TConfirmDialogTriggerProps) => {
  const { tone } = useConfirmDialogContext();
  const disabledReasonId = useId();
  const isDisabled = Boolean(disabledReason);

  return (
    <>
      <AlertDialog.Trigger
        render={
          <Button
            type="button"
            variant={tone}
            size={size}
            focusGround={focusGround}
            aria-label={ariaLabel}
            isAriaDisabled={isDisabled}
            aria-describedby={isDisabled ? disabledReasonId : undefined}
          />
        }
      >
        {children}
      </AlertDialog.Trigger>
      {isDisabled && (
        <Text id={disabledReasonId} variant="meta">
          {disabledReason}
        </Text>
      )}
    </>
  );
};
