'use client';

import { signIn } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export type TEmailStep = 'collapsed' | 'expanded' | 'submitting' | 'sent';

/**
 * useEmailSignIn — the email (magic-link) sub-flow's state machine for
 * `SignInMenu`'s inline-expanding "Continue with email" item: its own step
 * state, form field, error, focus-on-expand, and submit handling. `open`
 * (the parent popover's own open/close state) is passed in as a parameter
 * rather than read here, since it's owned by `AuthMenu`'s single
 * `usePopover()` call, not by this hook.
 */
export function useEmailSignIn(open: boolean) {
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

  return {
    emailStep,
    setEmailStep,
    email,
    setEmail,
    emailError,
    emailFormRef,
    handleEmailSubmit,
  };
}
