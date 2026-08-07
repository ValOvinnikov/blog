'use client';

import { Size } from '@blog/config';
import { Avatar, Button, TextInput } from '@blog/ui/atoms';
import { useToast } from '@web/components/shared/toast-provider';
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
 * DisplayNameControl — the `/account` 6c section's "display name" row's
 * control-slot client island (#1159/#1162): `Avatar` + a controlled
 * `TextInput` + a solid "save" `Button`, slotted into `SettingRow.children`
 * from the server-rendered `IdentitySection` (`web-component-practices`
 * Rule 1 — the pure `SettingRow` never wraps this, it just renders it).
 * `Avatar` needs no interactivity of its own, but lives inside this client
 * boundary anyway since it's part of the same control-slot composition the
 * mock groups together — only the editable `TextInput` strictly requires
 * the client boundary, and `Avatar`/`Button` ride along with it.
 *
 * Mirrors `NewsletterSubscriptionControl`'s exact save pattern: the
 * session-gated `updateDisplayNameAction` server action runs through
 * `useToast`'s `promise` helper, wrapped in a thin async function that
 * throws when `result.ok` is `false`. `router.refresh()` on success re-runs
 * `IdentitySection`'s server-side session read so the rest of the page
 * (and any other session-derived UI, e.g. the header's account menu) picks
 * up the new name on next navigation. `isPending` (`useTransition`)
 * separately gates the input/button `disabled` state and the button's
 * `aria-busy`.
 *
 * Renders its own explicit two-row wrapper rather than relying on
 * `SettingRow`'s generic control-slot stacking (#1225): `Avatar` +
 * `TextInput` share one row with the input taking the remaining flex space
 * (also fixing the input's previous fixed `w-40` truncating longer names),
 * and the "save" `Button` sits on its own full-width row below on mobile,
 * inline at the end of the row again from `md:` up.
 */
export function DisplayNameControl({
  initialName,
  email,
  image,
}: TDisplayNameControlProps) {
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
            loading: {
              command: t('saveToastCommand'),
              state: t('saveToastLoadingState'),
              message: t('saveToastLoadingMessage'),
            },
            success: {
              command: t('saveToastCommand'),
              state: t('saveToastSuccessState'),
              message: t('saveToastSuccessMessage'),
            },
            error: {
              command: t('saveToastCommand'),
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
          prompt="›"
          disabled={isPending}
          className={field()}
        />
      </div>
      <Button
        variant="primary"
        disabled={isSaveDisabled}
        aria-busy={isPending}
        onClick={handleSave}
        className={button()}
      >
        {t('saveButton')}
      </Button>
    </div>
  );
}
