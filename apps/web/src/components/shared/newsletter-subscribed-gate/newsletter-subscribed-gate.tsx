'use client';

import { hasNewsletterSubscribedCookie } from '@web/utils/has-newsletter-subscribed-cookie';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';
import { type ReactNode, useSyncExternalStore } from 'react';

type TNewsletterSubscribedGateProps = {
  children: ReactNode;
};

const HIDE_IF_SUBSCRIBED_SCRIPT = `(function(){var s=document.currentScript;var p=s&&s.previousElementSibling;if(p&&document.cookie.split('; ').some(function(c){return c.indexOf('${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=')===0})){p.hidden=true}})()`;

const subscribeToNothing = () => () => {};
const readCookie = () => hasNewsletterSubscribedCookie(document.cookie);
const readServerCookie = () => false;

export const NewsletterSubscribedGate = ({
  children,
}: TNewsletterSubscribedGateProps) => {
  const isSubscribed = useSyncExternalStore(
    subscribeToNothing,
    readCookie,
    readServerCookie,
  );

  if (isSubscribed) return null;

  return (
    <>
      <div suppressHydrationWarning={true}>{children}</div>
      <script
        suppressHydrationWarning={true}
        dangerouslySetInnerHTML={{ __html: HIDE_IF_SUBSCRIBED_SCRIPT }}
      />
    </>
  );
};
