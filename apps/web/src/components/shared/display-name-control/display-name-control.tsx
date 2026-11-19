'use client';

import { ICONS, SIZE, type TNullable } from '@shinefold/config';
import { Avatar } from '@shinefold/ui/components/atoms/avatar';
import { Button } from '@shinefold/ui/components/atoms/button';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { TextInput } from '@shinefold/ui/components/atoms/text-input';
import { hasLength } from '@shinefold/utils/primitives';
import { useBusyStyle } from '@web/context/busy-style-provider';
import { useActionToast } from '@web/hooks/use-action-toast';
import { updateDisplayNameAction } from '@web/server/account/identity-actions/identity-actions';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

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
  const { busyStyle, spinnerVariant } = useBusyStyle();
  const { isPending, run } = useActionToast();
  const [name, setName] = useState(initialName);
  const [imageFailed, setImageFailed] = useState(false);
  const { root, avatarInputRow, field, button } = displayNameControlVariants();

  const avatarName = name.trim() || email || '';
  const avatarSrc = imageFailed ? undefined : (image ?? undefined);
  const isNameEmpty = !hasLength(name.trim());

  const handleSave = () => {
    run(() => updateDisplayNameAction(name), {
      loading: t('saveToastLoadingMessage'),
      success: t('saveToastSuccessMessage'),
      error: t('saveError'),
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
        isDisabled={isNameEmpty}
        isBusy={isPending}
        busyLabel={t('savingLabel')}
        busyStyle={busyStyle}
        spinnerVariant={spinnerVariant}
        onClick={handleSave}
        className={button()}
      >
        {t('saveButton')}
      </Button>
    </div>
  );
};
