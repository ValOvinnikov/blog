'use client';

import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Dialog } from '@platform/components/shared/dialog';
import { FormField } from '@platform/components/shared/form-field';
import { Icon } from '@platform/components/shared/icon';
import { TextInput } from '@platform/components/shared/text-input';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { ICON_SIZE } from '@platform/constants/icon';
import { TEAM_SEAT_NOTICE_ID } from '@platform/constants/team-access';
import { ALERT_TYPE, ICONS } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

import { useInviteEditor } from './use-invite-editor';

export type TInviteEditorControlProps = {
  tenantId: string;
  plan: TTenantPlan;
  isFull: boolean;
};

export const InviteEditorControl = ({
  tenantId,
  plan,
  isFull,
}: TInviteEditorControlProps) => {
  const tTeam = useTranslations('teamPage');
  const t = useTranslations('teamPage.inviteDialog');
  const tPlan = useTranslations('planNames');
  const {
    isOpen,
    changeOpen,
    email,
    changeEmail,
    fieldError,
    hasFailed,
    isPending,
    submit,
  } = useInviteEditor(tenantId);

  return (
    <>
      <Button
        variant={BUTTON_VARIANT.PRIMARY}
        focusGround={FOCUS_RING_GROUND.BG}
        isAriaDisabled={isFull}
        aria-describedby={isFull ? TEAM_SEAT_NOTICE_ID : undefined}
        onClick={() => changeOpen(true)}
      >
        <Icon name={ICONS.PLUS} size={ICON_SIZE.XL} />
        {tTeam('inviteEditor')}
      </Button>
      <Dialog
        isOpen={isOpen}
        onOpenChange={changeOpen}
        isPending={isPending}
        title={t('title')}
        footer={
          <>
            <Button
              variant={BUTTON_VARIANT.SECONDARY}
              isDisabled={isPending}
              onClick={() => changeOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant={BUTTON_VARIANT.PRIMARY}
              isPending={isPending}
              pendingLabel={t('sending')}
              onClick={submit}
            >
              {t('send')}
            </Button>
          </>
        }
      >
        <Alert type={ALERT_TYPE.INFO} description={t('notice')} />
        <FormField
          label={t('emailLabel')}
          hint={t('emailHint')}
          error={
            fieldError &&
            t(`fieldError.${fieldError.reason}`, {
              ...fieldError.values,
              plan: tPlan(plan),
            })
          }
        >
          <TextInput
            type="email"
            value={email}
            onChange={changeEmail}
            placeholder={t('emailPlaceholder')}
          />
        </FormField>
        {hasFailed && <Alert type={ALERT_TYPE.ERROR} title={t('failed')} />}
      </Dialog>
    </>
  );
};
