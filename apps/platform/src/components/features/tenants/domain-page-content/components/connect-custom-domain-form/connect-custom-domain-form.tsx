'use client';

import { Form } from '@base-ui/react/form';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import { useConnectCustomDomain } from './use-connect-custom-domain';

const connectCustomDomainFormVariants = tv({
  slots: {
    fields: ['flex flex-col gap-4'],
    footerActions: ['ml-auto flex items-center gap-2'],
  },
});

export type TConnectCustomDomainFormProps = {
  tenantId: string;
};

export const ConnectCustomDomainForm = ({
  tenantId,
}: TConnectCustomDomainFormProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const { domain, setDomain, error, isPending, submit } =
    useConnectCustomDomain(tenantId);
  const { fields, footerActions } = connectCustomDomainFormVariants();

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
              error={error}
            >
              <TextInput
                value={domain}
                onChange={setDomain}
                placeholder={t('domainPlaceholder')}
              />
            </FormField>
          </div>
        </Card.Body>
        <Card.Footer>
          <div className={footerActions()}>
            <Button
              type="submit"
              variant="primary"
              isPending={isPending}
              pendingLabel={t('connecting')}
            >
              {t('connect')}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </Form>
  );
};
