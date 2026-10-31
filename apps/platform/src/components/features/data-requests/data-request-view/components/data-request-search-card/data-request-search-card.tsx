'use client';

import { Form } from '@base-ui/react/form';
import type { TMaybeUndefined } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

const dataRequestSearchCardVariants = tv({
  slots: {
    emailField: ['max-w-md'],
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
  const { emailField, footerActions } = dataRequestSearchCardVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Card>
        <Card.Header title={t('title')} supportingText={t('supportingText')} />
        <Card.Body>
          <div className={emailField()}>
            <FormTextInput
              type="email"
              label={t('emailLabel')}
              hint={t('emailHint')}
              placeholder={t('emailPlaceholder')}
              error={error}
              value={email}
              onChange={onEmailChange}
            />
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
              {t('findData')}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </Form>
  );
};
