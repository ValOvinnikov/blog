'use client';

import { hasNewsletterSubscribedCookie } from '@web/utils/has-newsletter-subscribed-cookie';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';
import { type ReactNode, useRef, useSyncExternalStore } from 'react';

type TNewsletterSubscribedGateProps = {
  children: ReactNode;
};

const HIDE_IF_SUBSCRIBED_SCRIPT = `(function(){var s=document.currentScript;var p=s&&s.previousElementSibling;if(p&&document.cookie.split('; ').some(function(c){return c.indexOf('${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=')===0})){p.hidden=true}})()`;

type TPhase = 'pending' | 'open' | 'subscribed';

const subscribeToNothing = () => () => {};
const getServerPhase = (): TPhase => 'pending';

export const NewsletterSubscribedGate = ({
  children,
}: TNewsletterSubscribedGateProps) => {
  const frozenPhase = useRef<TPhase | null>(null);
  const getClientPhase = (): TPhase => {
    frozenPhase.current ??= hasNewsletterSubscribedCookie(document.cookie)
      ? 'subscribed'
      : 'open';
    return frozenPhase.current;
  };
  const phase = useSyncExternalStore(
    subscribeToNothing,
    getClientPhase,
    getServerPhase,
  );

  if (phase === 'subscribed') return null;

  return (
    <>
      <div suppressHydrationWarning={true}>{children}</div>
      {phase === 'pending' && (
        <script
          suppressHydrationWarning={true}
          dangerouslySetInnerHTML={{ __html: HIDE_IF_SUBSCRIBED_SCRIPT }}
        />
      )}
    </>
  );
};
