import {
  FORM_STATUS,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TButtonProps } from '@blog/ui/components/atoms/button';
import { useId, type ReactNode, type Ref } from 'react';

import {
  SignInPanelEmailForm,
  type ISignInPanelEmailForm,
  type ISignInPanelEmailFormLabels,
} from './components/email-form/sign-in-panel-email-form';
import {
  SignInPanelProvider,
  type ISignInPanelProvider,
} from './components/provider/sign-in-panel-provider';
import { SignInPanelSent } from './components/sent/sign-in-panel-sent';
import { signInPanelVariants } from './sign-in-panel-variants';

export interface ISignInPanelLabels extends ISignInPanelEmailFormLabels {
  title: string;
  or: string;
  hint: string;
  sentTitle: string;
  sentMessage: ReactNode;
  useDifferentEmail: string;
}

export interface ISignInPanelSurface {
  id: string;
  isOpen: boolean;
}

export type TSignInPanelProps = IWithClassName &
  IWithDataTestId & {
    panel: ISignInPanelSurface;
    labels: ISignInPanelLabels;
    providers: ISignInPanelProvider[];
    pendingProviderId?: string;
    emailForm: ISignInPanelEmailForm;
    busyStyle?: TButtonProps['busyStyle'];
    spinnerVariant?: TButtonProps['spinnerVariant'];
    ref?: Ref<HTMLDivElement>;
  };

/** The signed-out reader's sign-in dialog, offering every provider and the email link at once and reporting each step of the attempt. */
export const SignInPanel = ({
  panel,
  labels,
  providers,
  pendingProviderId,
  emailForm,
  busyStyle,
  spinnerVariant,
  ref,
  className,
  dataTestId,
}: TSignInPanelProps) => {
  const { id, isOpen } = panel;
  const titleId = useId();
  const s = signInPanelVariants();
  const isSent = emailForm.status === FORM_STATUS.SUCCESS;
  const isSending = emailForm.status === FORM_STATUS.SUBMITTING;

  const title = (
    <p id={titleId} className={s.title()}>
      {isSent ? labels.sentTitle : labels.title}
    </p>
  );

  return (
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-labelledby={titleId}
      hidden={!isOpen}
      data-testid={dataTestId}
      className={s.root({ class: className })}
    >
      {isSent ? (
        <SignInPanelSent
          title={title}
          message={labels.sentMessage}
          resetLabel={labels.useDifferentEmail}
          onReset={emailForm.onReset}
        />
      ) : (
        <>
          {title}
          {providers.length > 0 && (
            <>
              <div className={s.providers()}>
                {providers.map((provider) => (
                  <SignInPanelProvider
                    key={provider.id}
                    provider={provider}
                    isPending={provider.id === pendingProviderId}
                    spinnerVariant={spinnerVariant}
                    isWaiting={
                      isSending ||
                      (Boolean(pendingProviderId) &&
                        provider.id !== pendingProviderId)
                    }
                  />
                ))}
              </div>
              <p className={s.or()}>{labels.or}</p>
            </>
          )}
          <SignInPanelEmailForm
            emailForm={emailForm}
            labels={labels}
            busyStyle={busyStyle}
            spinnerVariant={spinnerVariant}
          />
          <p className={s.hint()}>{labels.hint}</p>
        </>
      )}
    </div>
  );
};
