import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import {
  ICONS,
  SIZE,
  TEXT_ROLE,
  type IWithClassName,
  type IWithDataTestId,
  type TMaybeNull,
} from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { IconButton } from '@shinefold/ui/components/atoms/icon-button';
import type { THeadingLevel } from '@shinefold/ui/lib/react';
import { useRef, type ReactNode, type RefObject } from 'react';

import { dialogVariants } from './dialog-variants';

export type TDialogProps = IWithClassName &
  IWithDataTestId & {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    heading: string;
    headingLevel: THeadingLevel;
    closeLabel?: string;
    fallbackFocusRef?: RefObject<TMaybeNull<HTMLElement>>;
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
  const openerRef = useRef<TMaybeNull<Element>>(null);

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
                <Heading
                  level={headingLevel}
                  visual={TEXT_ROLE.DIALOG_TITLE}
                  id={id}
                >
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
