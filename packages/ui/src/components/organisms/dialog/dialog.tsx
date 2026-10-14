import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { useRef, type ReactNode, type RefObject } from 'react';

import { dialogVariants } from './dialog-variants';

export type TDialogProps = IWithClassName &
  IWithDataTestId & {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    heading: string;
    headingLevel: THeadingLevel;
    closeLabel?: string;
    fallbackFocusRef?: RefObject<HTMLElement | null>;
    children?: ReactNode;
  };

const s = dialogVariants();

/** A modal window over the page, named by its heading; client-only, so the consumer declares the client boundary. */
export const Dialog = ({
  isOpen,
  onOpenChange,
  heading,
  headingLevel,
  closeLabel,
  fallbackFocusRef,
  children,
  className,
  dataTestId,
}: TDialogProps) => {
  const openerRef = useRef<Element | null>(null);

  const captureOpener = () => {
    openerRef.current = document.activeElement;
    return true;
  };

  const resolveFinalFocus = () =>
    openerRef.current?.isConnected ? true : (fallbackFocusRef?.current ?? true);

  return (
    <BaseDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className={s.backdrop()}
          data-testid="dialog-backdrop"
        />
        <BaseDialog.Popup
          initialFocus={captureOpener}
          finalFocus={resolveFinalFocus}
          className={s.popup({ class: className })}
          data-testid={dataTestId}
        >
          <div className={s.header()}>
            <BaseDialog.Title
              render={({ id }) => (
                <Heading level={headingLevel} id={id} className={s.heading()}>
                  {heading}
                </Heading>
              )}
            />
            {closeLabel && (
              <BaseDialog.Close
                render={
                  <IconButton ariaLabel={closeLabel} className={s.close()}>
                    <Icon name={ICONS.CLOSE} size={SIZE.SM} />
                  </IconButton>
                }
              />
            )}
          </div>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
};
