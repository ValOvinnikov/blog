import { ACTION_OUTCOME, FORM_STATUS, type TFormStatus } from '@blog/config';
import {
  submitContactMessage,
  type TContactRefusal,
  type TSubmitContactResult,
} from '@web/server/contact-form/contact-form-actions/contact-form-actions';
import {
  type TContactField,
  type TContactFieldErrors,
  type TContactMessageFields,
  validateContactMessage,
} from '@web/utils/validate-contact-message/validate-contact-message';
import { usePathname } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';

const EMPTY_FIELDS: TContactMessageFields = {
  name: '',
  email: '',
  message: '',
};

const SERVER_ERROR: TSubmitContactResult = {
  outcome: ACTION_OUTCOME.SERVER_ERROR,
};

export const useContactForm = () => {
  const pathname = usePathname();
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<TFormStatus>(FORM_STATUS.IDLE);
  const [fieldErrors, setFieldErrors] = useState<TContactFieldErrors>({});
  const [refusal, setRefusal] = useState<TContactRefusal>();
  const [invalidSubmitCount, setInvalidSubmitCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (invalidSubmitCount === 0) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [invalidSubmitCount]);

  const reportInvalid = (invalid: TContactFieldErrors) => {
    setFieldErrors(invalid);
    setInvalidSubmitCount((count) => count + 1);
  };

  const changeField = (field: TContactField) => (value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRefusal(undefined);

    const validation = validateContactMessage(fields);
    if (!validation.ok) {
      reportInvalid(validation.fieldErrors);
      return;
    }

    setStatus(FORM_STATUS.SUBMITTING);
    const result = await submitContactMessage({
      ...fields,
      website,
      sourcePath: pathname ?? '/',
    }).catch(() => SERVER_ERROR);

    if (result.outcome === ACTION_OUTCOME.SUCCESS) {
      setStatus(FORM_STATUS.SUCCESS);
      return;
    }

    setStatus(FORM_STATUS.ERROR);
    if (result.outcome === ACTION_OUTCOME.INVALID) {
      reportInvalid(result.fieldErrors);
      return;
    }
    setRefusal(result.outcome);
  };

  return {
    formRef,
    fields,
    website,
    setWebsite,
    status,
    fieldErrors,
    refusal,
    changeField,
    submit,
  };
};
