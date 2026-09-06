'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ICONS, SIZE, type TIconName } from '@blog/config';
import { Button } from '@blog/ui/atoms/button';
import { Icon } from '@blog/ui/atoms/icon';
import { Text } from '@blog/ui/atoms/text';
import { TextInput } from '@blog/ui/atoms/text-input';
import { PopoverMenu } from '@blog/ui/molecules/popover-menu';
import { authMenuVariants } from '@web/components/shared/auth-menu/auth-menu-variants';
import { useEmailSignIn } from '@web/components/shared/auth-menu/hooks/use-email-sign-in';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import type { RefObject } from 'react';

import { signInMenuVariants } from './sign-in-menu-variants';

export type TSignInMenuProps = {
  panelId: string;
  isOpen: boolean;
  toggle: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  oauthError: string | null;
  /** Auth.js provider ids to render a button for, server-derived from credential presence. */
  oauthProviderIds: readonly TOAuthProviderId[];
};

/**
 * `AuthMenu`'s logged-out render branch: a `PopoverMenu.Panel` offering
 * GitHub, Google, and an inline-expanding email (magic-link) sign-in, plus
 * the OAuth redirect-back error notice. The title is a plain styled label,
 * not a heading — `role="menu"` doesn't own heading elements per the ARIA
 * menu pattern, and this panel renders ahead of every page's own `<h1>` in
 * `[tenant]/[locale]/layout.tsx`. The email sub-flow's state machine lives
 * in `useEmailSignIn`; open/close state and refs come from the parent's
 * single `usePopover()` call — this component never calls `usePopover()`
 * itself.
 */
export const SignInMenu = ({
  panelId,
  isOpen,
  toggle,
  triggerRef,
  panelRef,
  oauthError,
  oauthProviderIds,
}: TSignInMenuProps) => {
  const t = useTranslations('authMenu');
  const {
    emailStep,
    setEmailStep,
    email,
    setEmail,
    emailError,
    emailFormRef,
    handleEmailSubmit,
  } = useEmailSignIn(isOpen);
  const { panel } = authMenuVariants();
  const {
    label,
    providerPrompt,
    providerButton,
    hint,
    errorNotice,
    emailForm,
    emailFormActions,
    emailHint,
    emailSent,
  } = signInMenuVariants();

  // `providerId` is the Auth.js provider id (next-auth's default lowercase
  // ids) — kept separate from `icon`, the unrelated `ICONS` key.
  const allProviders: {
    providerId: TOAuthProviderId;
    icon: TIconName;
    label: string;
  }[] = [
    {
      providerId: 'github',
      icon: ICONS.GITHUB,
      label: t('continueWithGithub'),
    },
    {
      providerId: 'google',
      icon: ICONS.GOOGLE,
      label: t('continueWithGoogle'),
    },
  ];
  const providers = allProviders.filter(({ providerId }) =>
    oauthProviderIds.includes(providerId),
  );

  return (
    <PopoverMenu>
      <PopoverMenu.Trigger
        ref={triggerRef}
        ariaLabel={t('signIn')}
        isOpen={isOpen}
        panelId={panelId}
        onClick={toggle}
        variant="bordered"
      >
        {t('signIn')}
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        ref={panelRef}
        id={panelId}
        isOpen={isOpen}
        ariaLabel={t('panelAriaLabel')}
        className={panel()}
      >
        <Text variant="emphasis" className={label()}>
          {t('signInHeading')}
        </Text>
        <Text variant="card" className={providerPrompt()}>
          {t('chooseProviderPrompt')}
        </Text>
        {providers.map(({ providerId, icon, label: providerLabel }) => (
          <PopoverMenu.Item
            key={providerId}
            variant="bordered"
            className={providerButton()}
            icon={<Icon name={icon} size={SIZE.SM} />}
            onClick={() => signIn(providerId)}
          >
            {providerLabel}
          </PopoverMenu.Item>
        ))}
        {emailStep === 'sent' && (
          <p role="status" aria-live="polite" className={emailSent()}>
            {t('checkYourInbox')}
          </p>
        )}
        {emailStep === 'collapsed' && (
          <PopoverMenu.Item
            variant="bordered"
            className={providerButton()}
            onClick={() => setEmailStep('expanded')}
          >
            {t('continueWithEmail')}
          </PopoverMenu.Item>
        )}
        {(emailStep === 'expanded' || emailStep === 'submitting') && (
          <form
            ref={emailFormRef}
            className={emailForm()}
            onSubmit={handleEmailSubmit}
          >
            <TextInput
              type="email"
              isRequired={true}
              value={email}
              onChange={setEmail}
              ariaLabel={t('emailAriaLabel')}
              placeholder={t('emailPlaceholder')}
              leadingIcon={
                <Icon
                  name={ICONS.CHEVRON_RIGHT}
                  size={SIZE.SM}
                  dataTestId="sign-in-prompt-icon"
                />
              }
              isInvalid={emailError}
              isDisabled={emailStep === 'submitting'}
            />
            {emailError && (
              <p role="status" aria-live="polite" className={emailHint()}>
                {t('emailError')}
              </p>
            )}
            <div className={emailFormActions()}>
              <Button
                size={SIZE.SM}
                isDisabled={emailStep === 'submitting'}
                onClick={handleEmailSubmit}
              >
                {emailStep === 'submitting' ? t('sending') : t('sendLink')}
              </Button>
            </div>
          </form>
        )}
        <p className={hint()}>{t('redirectHint')}</p>
      </PopoverMenu.Panel>
      {Boolean(oauthError) && !isOpen && (
        <p role="alert" className={errorNotice()}>
          {t('oauthError')}
        </p>
      )}
    </PopoverMenu>
  );
};
