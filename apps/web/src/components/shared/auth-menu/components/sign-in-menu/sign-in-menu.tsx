'use client';

import { ICONS, Size } from '@blog/config';
import { Button, Icon, Text, TextInput } from '@blog/ui/atoms';
import { PopoverMenu, WindowChrome } from '@blog/ui/molecules';
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
  /** Renders the panel without the `WindowChrome` terminal shell. */
  isPlain?: boolean;
};

/**
 * `AuthMenu`'s logged-out render branch: a `PopoverMenu` dressed in the
 * `WindowChrome` terminal shell offering GitHub, Google, and an
 * inline-expanding email (magic-link) sign-in, plus the OAuth redirect-back
 * error notice. The email sub-flow's state machine lives in
 * `useEmailSignIn`; open/close state and refs come from the parent's single
 * `usePopover()` call — this component never calls `usePopover()` itself.
 */
export function SignInMenu({
  panelId,
  isOpen,
  toggle,
  triggerRef,
  panelRef,
  oauthError,
  isPlain = false,
}: TSignInMenuProps) {
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
  const { panel, window: windowSize } = authMenuVariants();
  const {
    cmdLine,
    cmdPrompt,
    cmdCursor,
    plainLabel,
    plainPrompt,
    providerButton,
    hint,
    errorNotice,
    emailForm,
    emailFormActions,
    emailHint,
    emailSent,
  } = signInMenuVariants();

  // `providerId` is the Auth.js provider id (`auth.ts`'s `GitHub`/`Google`
  // configs use next-auth's default lowercase ids, no `id` override) —
  // deliberately kept separate from `icon`, the unrelated `ICONS` key used
  // only to pick which `<Icon />` glyph renders.
  const providers = [
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

  const menuContent = (
    <>
      {isPlain ? (
        <Text variant="card" className={plainPrompt()}>
          {t('chooseProviderPrompt')}
        </Text>
      ) : (
        <p className={cmdLine()}>
          <span aria-hidden="true" className={cmdPrompt()}>
            &gt;
          </span>
          {t('chooseProviderPrompt')}
          <span aria-hidden="true" className={cmdCursor()} />
        </p>
      )}
      {providers.map(({ providerId, icon, label }) => (
        <PopoverMenu.Item
          key={providerId}
          variant="bordered"
          className={providerButton()}
          icon={<Icon name={icon} size={Size.SM} />}
          onClick={() => signIn(providerId)}
        >
          {label}
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
                size={Size.SM}
                dataTestId="sign-in-prompt-icon"
              />
            }
            invalid={emailError}
            isDisabled={emailStep === 'submitting'}
          />
          {emailError && (
            <p role="status" aria-live="polite" className={emailHint()}>
              {t('emailError')}
            </p>
          )}
          <div className={emailFormActions()}>
            <Button
              size={Size.SM}
              isDisabled={emailStep === 'submitting'}
              onClick={handleEmailSubmit}
            >
              {emailStep === 'submitting' ? t('sending') : t('sendLink')}
            </Button>
          </div>
        </form>
      )}
      <p className={hint()}>{t('redirectHint')}</p>
    </>
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
        className={isPlain ? windowSize() : panel()}
      >
        {isPlain ? (
          <>
            <Text variant="card" className={plainLabel()}>
              {t('signIn')}
            </Text>
            {menuContent}
          </>
        ) : (
          <WindowChrome className={windowSize()}>
            <WindowChrome.Bar>
              <WindowChrome.User>{t('guestLabel')}</WindowChrome.User>{' '}
              <WindowChrome.Prompt>{t('promptHost')}</WindowChrome.Prompt>{' '}
              {t('promptCommandSignIn')}
            </WindowChrome.Bar>
            <WindowChrome.Body>{menuContent}</WindowChrome.Body>
          </WindowChrome>
        )}
      </PopoverMenu.Panel>
      {Boolean(oauthError) && !isOpen && (
        <p role="alert" className={errorNotice()}>
          {t('oauthError')}
        </p>
      )}
    </PopoverMenu>
  );
}
