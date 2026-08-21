'use client';

import { ICONS, Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Button } from '@blog/ui/atoms/button';
import { Icon } from '@blog/ui/atoms/icon';
import { TextInput } from '@blog/ui/atoms/text-input';
import { useToast } from '@web/context/toast-provider';
import { updateDisplayNameAction } from '@web/server/account/identity-actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { displayNameControlVariants } from './display-name-control-variants';

export type TDisplayNameControlProps = {
  /** The current display name, read from the session server-side. */
  initialName: string;
  email?: string | null;
  image?: string | null;
};

/**
 * `Avatar` + a controlled `TextInput` + a solid "save" `Button`, slotted
 * into `SettingRow.children` from the server-rendered `IdentitySection`.
 * Only the editable `TextInput` strictly requires the client boundary, but
 * `Avatar`/`Button` ride along with it as part of the same control-slot
 * composition. Mirrors `NewsletterSubscriptionControl`'s save pattern;
 * `router.refresh()` on success re-runs `IdentitySection`'s server-side
 * session read so other session-derived UI (e.g. the header's account menu)
 * picks up the new name on next navigation.
 *
 * Renders its own explicit two-row wrapper rather than relying on
 * `SettingRow`'s generic control-slot stacking: `Avatar` + `TextInput` share
 * one row with the input taking the remaining flex space, and the "save"
 * `Button` sits on its own full-width row below on mobile, inline at the end
 * of the row again from `md:` up.
 */
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
            if (!result.ok) throw new Error('Failed to update display name');
            return result;
          })(),
          {
            command: t('saveToastCommand'),
            loading: {
              state: t('saveToastLoadingState'),
              message: t('saveToastLoadingMessage'),
            },
            success: {
              state: t('saveToastSuccessState'),
              message: t('saveToastSuccessMessage'),
            },
            error: {
              state: t('saveToastErrorState'),
              message: t('saveError'),
            },
          },
        );
      } catch {
        // Already surfaced via the `toast.promise` error branch above.
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
          size={Size.SM}
          onImageError={() => setImageFailed(true)}
        />
        <TextInput
          value={name}
          onChange={setName}
          ariaLabel={t('displayNameAriaLabel')}
          leadingIcon={
            <Icon
              name={ICONS.CHEVRON_RIGHT}
              size={Size.SM}
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
