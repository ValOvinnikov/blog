'use client';

import { Form } from '@base-ui/react/form';
import type { TMaybeUndefined } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import {
  useAddBlockedDomain,
  type TFieldErrorKey,
} from './use-add-blocked-domain';

const addBlockedDomainCardVariants = tv({
  slots: {
    fields: ['flex flex-col gap-4'],
    footerActions: ['ml-auto flex items-center gap-2'],
  },
});

export const AddBlockedDomainCard = () => {
  const t = useTranslations('addBlockedDomainCard');
  const {
    domain,
    reason,
    setDomain,
    setReason,
    domainErrorKey,
    reasonErrorKey,
    isPending,
    submit,
  } = useAddBlockedDomain({
    added: t('domainBlocked'),
    failed: t('domainBlockFailed'),
  });
  const errorText = (key: TMaybeUndefined<TFieldErrorKey>) => key && t(key);
  const { fields, footerActions } = addBlockedDomainCardVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Card>
        <Card.Header title={t('title')} supportingText={t('supportingText')} />
        <Card.Body>
          <div className={fields()}>
            <FormField
              label={t('domainLabel')}
              hint={t('domainHint')}
              error={errorText(domainErrorKey)}
            >
              <TextInput
                value={domain}
                onChange={setDomain}
                placeholder={t('domainPlaceholder')}
              />
            </FormField>
            <FormField
              label={t('reasonLabel')}
              error={errorText(reasonErrorKey)}
            >
              <TextInput value={reason} onChange={setReason} />
            </FormField>
          </div>
        </Card.Body>
        <Card.Footer>
          <div className={footerActions()}>
            <Button
              type="submit"
              variant={BUTTON_VARIANT.PRIMARY}
              isPending={isPending}
              pendingLabel={t('submitting')}
            >
              {t('blockSubmit')}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </Form>
  );
};
