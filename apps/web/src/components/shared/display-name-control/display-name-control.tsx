'use client';

import { ACTION_OUTCOME, ICONS, SIZE, type TNullable } from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { Button } from '@blog/ui/components/atoms/button';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextInput } from '@blog/ui/components/atoms/text-input';
import { useToast } from '@web/context/toast-provider';
import { updateDisplayNameAction } from '@web/server/account/identity-actions/identity-actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { displayNameControlVariants } from './display-name-control-variants';

export type TDisplayNameControlProps = {
  initialName: string;
  email?: TNullable<string>;
  image?: TNullable<string>;
};

export const DisplayNameControl = ({
  initialName,
  email,
  image,
}: TDisplayNameControlProps) => {
  const t = useTranslations('accountPage.identity');
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [imageFailed, setImageFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { root, avatarInputRow, field, button } = displayNameControlVariants();

  const avatarName = name.trim() || email || '';
  const avatarSrc = imageFailed ? undefined : (image ?? undefined);
  const isSaveDisabled = isPending || name.trim().length === 0;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await toast.promise(
          (async () => {
            const result = await updateDisplayNameAction(name);
            if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
              throw new Error('Failed to update display name');
            }
            return result;
          })(),
          {
            loading: { message: t('saveToastLoadingMessage') },
            success: { message: t('saveToastSuccessMessage') },
            error: { message: t('saveError') },
          },
        );
      } catch {
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className={root()}>
      <div className={avatarInputRow()}>
        <Avatar
          src={avatarSrc}
          name={avatarName}
          alt=""
          size={SIZE.SM}
          onImageError={() => setImageFailed(true)}
        />
        <TextInput
          value={name}
          onChange={setName}
          ariaLabel={t('displayNameAriaLabel')}
          leadingIcon={
            <Icon
              name={ICONS.CHEVRON_RIGHT}
              size={SIZE.SM}
              dataTestId="display-name-prompt-icon"
            />
          }
          isDisabled={isPending}
          className={field()}
        />
      </div>
      <Button
        variant="primary"
        isDisabled={isSaveDisabled}
        aria-busy={isPending}
        onClick={handleSave}
        className={button()}
      >
        {t('saveButton')}
      </Button>
    </div>
  );
};
