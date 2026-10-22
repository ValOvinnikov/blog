'use client';

import { Form } from '@base-ui/react/form';
import type { TMaybeUndefined } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

const dataRequestSearchCardVariants = tv({
  slots: {
    footerActions: ['ml-auto flex items-center gap-2'],
  },
});

export type TDataRequestSearchCardProps = {
  email: string;
  onEmailChange: (email: string) => void;
  error: TMaybeUndefined<string>;
  isPending: boolean;
  onSubmit: () => void;
};

export const DataRequestSearchCard = ({
  email,
  onEmailChange,
  error,
  isPending,
  onSubmit,
}: TDataRequestSearchCardProps) => {
  const t = useTranslations('dataRequestSearchCard');
  const { footerActions } = dataRequestSearchCardVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Card>
        <Card.Header title={t('title')} supportingText={t('supportingText')} />
        <Card.Body>
          <FormTextInput
            type="email"
            label={t('emailLabel')}
            hint={t('emailHint')}
            placeholder={t('emailPlaceholder')}
            error={error}
            value={email}
            onChange={onEmailChange}
          />
        </Card.Body>
        <Card.Footer>
          <div className={footerActions()}>
            <Button
              type="submit"
              variant="primary"
              isPending={isPending}
              pendingLabel={t('submitting')}
            >
              {t('findData')}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </Form>
  );
};
