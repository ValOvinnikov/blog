'use client';

import { hasNewsletterSubscribedCookie } from '@web/utils/has-newsletter-subscribed-cookie';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';
import { type ReactNode, useLayoutEffect, useState } from 'react';

type TNewsletterSubscribedGateProps = {
  children: ReactNode;
};

const HIDE_IF_SUBSCRIBED_SCRIPT = `(function(){var s=document.currentScript;var p=s&&s.previousElementSibling;if(p&&document.cookie.split('; ').some(function(c){return c.indexOf('${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=')===0})){p.hidden=true}})()`;

export const NewsletterSubscribedGate = ({
  children,
}: TNewsletterSubscribedGateProps) => {
  const [phase, setPhase] = useState<'pending' | 'open' | 'subscribed'>(
    'pending',
  );

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase(
      hasNewsletterSubscribedCookie(document.cookie) ? 'subscribed' : 'open',
    );
  }, []);

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
