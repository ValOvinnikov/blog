import { ALERT_TYPE, FORM_STATUS, SIZE, type TFormStatus } from '@blog/config';
import { Alert } from '@blog/ui/components/atoms/alert';
import { Button } from '@blog/ui/components/atoms/button';
import { Spinner } from '@blog/ui/components/atoms/spinner';
import { TextInput } from '@blog/ui/components/atoms/text-input';
import { useId, type SubmitEvent } from 'react';

import { signInPanelEmailFormVariants } from './sign-in-panel-email-form-variants';

export interface ISignInPanelEmailForm {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  status: TFormStatus;
  errorMessage?: string;
}

export interface ISignInPanelEmailFormLabels {
  email: string;
  emailPlaceholder: string;
  submit: string;
  sending: string;
}

type TSignInPanelEmailFormProps = {
  emailForm: ISignInPanelEmailForm;
  labels: ISignInPanelEmailFormLabels;
};

/** The always-visible email field and send button of the sign-in panel, with its sending and couldn't-send feedback. */
export const SignInPanelEmailForm = ({
  emailForm,
  labels,
}: TSignInPanelEmailFormProps) => {
  const { value, onChange, onSubmit, status, errorMessage } = emailForm;
  const inputId = useId();
  const errorId = useId();
  const s = signInPanelEmailFormVariants();
  const isSending = status === FORM_STATUS.SUBMITTING;
  const hasError = status === FORM_STATUS.ERROR && Boolean(errorMessage);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSending) {
      onSubmit();
    }
  };

  return (
    <form className={s.root()} onSubmit={handleSubmit}>
      <label htmlFor={inputId} className={s.label()}>
        {labels.email}
      </label>
      <TextInput
        id={inputId}
        type="email"
        value={value}
        onChange={onChange}
        ariaLabel={labels.email}
        placeholder={labels.emailPlaceholder}
        isRequired={true}
        isDisabled={isSending}
        isInvalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
      />
      {hasError && errorMessage && (
        <Alert type={ALERT_TYPE.ERROR} message={errorMessage} id={errorId} />
      )}
      <Button
        type="submit"
        size={SIZE.SM}
        aria-busy={isSending || undefined}
        className={s.submit()}
      >
        <span className={s.submitLabels()}>
          <span className={s.submitLabel()}>
            {isSending && (
              <Spinner
                label={labels.sending}
                size={SIZE.SM}
                aria-hidden="true"
                className={s.spinner()}
              />
            )}
            {isSending ? labels.sending : labels.submit}
          </span>
          <span aria-hidden="true" className={s.spareLabel()}>
            {isSending ? labels.submit : labels.sending}
          </span>
        </span>
      </Button>
    </form>
  );
};
