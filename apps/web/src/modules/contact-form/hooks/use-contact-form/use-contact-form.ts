import { FORM_STATUS, type TFormStatus } from '@blog/config';
import {
  submitContactMessage,
  type TContactRefusal,
  type TSubmitContactResult,
} from '@web/server/contact-form/contact-form-actions/contact-form-actions';
import {
  type TContactField,
  type TContactMessageFields,
  validateContactMessage,
} from '@web/utils/validate-contact-message/validate-contact-message';
import { usePathname } from 'next/navigation';
import { type FormEvent, useState } from 'react';

const EMPTY_FIELDS: TContactMessageFields = {
  name: '',
  email: '',
  message: '',
};

const SERVER_ERROR: TSubmitContactResult = { outcome: 'server-error' };

export const useContactForm = () => {
  const pathname = usePathname();
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<TFormStatus>(FORM_STATUS.IDLE);
  const [invalidFields, setInvalidFields] = useState<TContactField[]>([]);
  const [refusal, setRefusal] = useState<TContactRefusal>();

  const changeField = (field: TContactField) => (value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setInvalidFields((current) => current.filter((item) => item !== field));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRefusal(undefined);

    const validation = validateContactMessage(fields);
    if (!validation.ok) {
      setInvalidFields(validation.invalidFields);
      return;
    }

    setStatus(FORM_STATUS.SUBMITTING);
    const result = await submitContactMessage({
      ...fields,
      website,
      sourcePath: pathname ?? '/',
    }).catch(() => SERVER_ERROR);

    if (result.outcome === 'sent') {
      setStatus(FORM_STATUS.SUCCESS);
      return;
    }

    setStatus(FORM_STATUS.ERROR);
    if (result.outcome === 'invalid') {
      setInvalidFields(result.invalidFields);
      return;
    }
    setRefusal(result.outcome);
  };

  return {
    fields,
    website,
    setWebsite,
    status,
    invalidFields,
    refusal,
    changeField,
    submit,
  };
};
