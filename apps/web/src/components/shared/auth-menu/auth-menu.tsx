'use client';

import { ICONS, Size } from '@blog/config';
import { Avatar, Button, Icon, TextInput } from '@blog/ui/atoms';
import { PopoverMenu } from '@blog/ui/molecules';
import { SmartLink } from '@web/components/shared/smart-link';
import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { usePopover } from '@web/hooks/use-popover';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import { authMenuVariants } from './auth-menu-variants';

// "My bookmarks" links here (Feature 4, #1043) — the route doesn't exist yet
// (a 404 today is expected, see #1107's scope note), so there's no
// `routes.bookmarks()` helper in `@blog/config` yet either; add one there
// alongside the real route instead of introducing it for this single caller.
const BOOKMARKS_PATH = '/bookmarks';

type TEmailStep = 'collapsed' | 'expanded' | 'submitting' | 'sent';

/**
 * AuthMenu — the header sign-in/account client island (#1107). Reads the
 * Auth.js session itself (`useSession`); takes no props. Logged-out renders
 * a `PopoverMenu` with GitHub, Google, and an inline-expanding email
 * (magic-link) item; logged-in renders an `Avatar`-triggered account menu
 * ("My bookmarks", "Sign out"). While the session is resolving it renders a
 * neutral placeholder — the same `mounted`-gated flash-avoidance pattern as
 * `ThemeToggleButton` — so the header never flips logged-out → logged-in
 * after hydration.
 */
export function AuthMenu() {
  const sessionResult = useSession();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { open, toggle, close, triggerRef, panelRef } = usePopover();
  const [emailStep, setEmailStep] = useState<TEmailStep>('collapsed');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const emailFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the email sub-form only once the popover itself closes (matches ThemeToggleButton's DOM-driven state pattern), not derivable during render
    setEmailStep('collapsed');
    setEmail('');
    setEmailError(false);
  }, [open]);

  useEffect(() => {
    // Collapsed → expanded unmounts the focused "Continue with email"
    // `PopoverMenu.Item` button and mounts this form in its place — move
    // focus into the new field so keyboard/screen-reader users don't lose
    // their place. `TextInput` (`@blog/ui`) doesn't forward a ref, so this
    // queries the one input inside the form we do hold a ref to, the same
    // ref-scoped-query pattern `useDismissibleMenu`'s `getFocusables` already
    // uses in this codebase (never an unscoped `document.querySelector`).
    if (emailStep !== 'expanded') return;

    emailFormRef.current?.querySelector('input')?.focus();
  }, [emailStep]);

  const {
    placeholder,
    signInTrigger,
    avatarTrigger,
    accountHeader,
    accountName,
    accountEmail,
    signOutItem,
    errorNotice,
    emailForm,
    emailFormActions,
    emailHint,
    emailSent,
  } = authMenuVariants();

  if (sessionResult.status === 'loading') {
    return <span aria-hidden="true" className={placeholder()} />;
  }

  if (sessionResult.status === 'authenticated') {
    const { name, email: userEmail, image } = sessionResult.data.user ?? {};
    const displayName = name ?? userEmail ?? '';

    return (
      <PopoverMenu>
        <PopoverMenu.Trigger
          ref={triggerRef}
          ariaLabel={t('accountMenuAriaLabel')}
          open={open}
          panelId={panelId}
          onClick={toggle}
          className={avatarTrigger()}
        >
          <Avatar
            src={image ?? undefined}
            name={displayName}
            alt=""
            size={Size.SM}
          />
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel
          ref={panelRef}
          id={panelId}
          open={open}
          ariaLabel={t('accountMenuAriaLabel')}
        >
          <div className={accountHeader()}>
            <p className={accountName()}>{displayName}</p>
            {userEmail && <p className={accountEmail()}>{userEmail}</p>}
          </div>
          <PopoverMenu.Separator />
          <PopoverMenu.Item
            as={SmartLink}
            href={BOOKMARKS_PATH}
            onClick={close}
          >
            {t('myBookmarks')}
          </PopoverMenu.Item>
          <PopoverMenu.Item onClick={() => signOut()} className={signOutItem()}>
            {t('signOut')}
          </PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>
    );
  }

  // Shared by the form's `onSubmit` (Enter key in the field) and the send
  // button's `onClick` — `Button` always renders a native `type="button"`
  // (never `submit`), so a click alone never fires the form's submit event;
  // wiring both to the same handler covers mouse and keyboard equally. The
  // parameter is typed structurally (only `preventDefault` is used) so one
  // handler accepts both a `FormEvent` and a `MouseEvent`.
  const handleEmailSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setEmailStep('submitting');
    setEmailError(false);

    const result = await signIn('email', { email, redirect: false });

    if (result.ok) {
      setEmailStep('sent');
    } else {
      setEmailStep('expanded');
      setEmailError(true);
    }
  };

  return (
    <PopoverMenu>
      <PopoverMenu.Trigger
        ref={triggerRef}
        ariaLabel={t('signIn')}
        open={open}
        panelId={panelId}
        onClick={toggle}
        className={signInTrigger()}
      >
        {t('signIn')}
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        ref={panelRef}
        id={panelId}
        open={open}
        ariaLabel={t('panelAriaLabel')}
      >
        <PopoverMenu.Item
          icon={<Icon name={ICONS.GITHUB} size={Size.SM} />}
          onClick={() => signIn('github')}
        >
          {t('continueWithGithub')}
        </PopoverMenu.Item>
        <PopoverMenu.Item
          icon={<Icon name={ICONS.GOOGLE} size={Size.SM} />}
          onClick={() => signIn('google')}
        >
          {t('continueWithGoogle')}
        </PopoverMenu.Item>
        {emailStep === 'sent' && (
          <p role="status" aria-live="polite" className={emailSent()}>
            {t('checkYourInbox')}
          </p>
        )}
        {emailStep === 'collapsed' && (
          <PopoverMenu.Item onClick={() => setEmailStep('expanded')}>
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
              required
              value={email}
              onChange={setEmail}
              ariaLabel={t('emailAriaLabel')}
              placeholder={t('emailPlaceholder')}
              prompt="›"
              invalid={emailError}
              disabled={emailStep === 'submitting'}
            />
            {emailError && (
              <p role="status" aria-live="polite" className={emailHint()}>
                {t('emailError')}
              </p>
            )}
            <div className={emailFormActions()}>
              <Button
                size={Size.SM}
                disabled={emailStep === 'submitting'}
                onClick={handleEmailSubmit}
              >
                {emailStep === 'submitting' ? t('sending') : t('sendLink')}
              </Button>
            </div>
          </form>
        )}
      </PopoverMenu.Panel>
      {Boolean(oauthError) && !open && (
        <p role="alert" className={errorNotice()}>
          {t('oauthError')}
        </p>
      )}
    </PopoverMenu>
  );
}
