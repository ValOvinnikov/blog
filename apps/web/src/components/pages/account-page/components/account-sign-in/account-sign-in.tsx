'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import type { TMaybeNull } from '@blog/config';
import { Heading } from '@blog/ui/components/atoms/heading';
import { accountPageVariants } from '@web/components/pages/account-page/account-page-variants';
import { ReaderSignInPanel } from '@web/components/shared/reader-sign-in-panel';
import { useId, useRef } from 'react';

const s = accountPageVariants();

export interface IAccountSignInProps {
  heading: string;
  oauthProviderIds: readonly TOAuthProviderId[];
}

export const AccountSignIn = ({
  heading,
  oauthProviderIds,
}: IAccountSignInProps) => {
  const panelId = useId();
  const panelRef = useRef<TMaybeNull<HTMLDivElement>>(null);

  return (
    <main className={s.root()}>
      <Heading level={1} visual="page" className={s.heading()}>
        {heading}
      </Heading>
      <ReaderSignInPanel
        panelId={panelId}
        isOpen={true}
        panelRef={panelRef}
        oauthProviderIds={oauthProviderIds}
        className={s.signIn()}
      />
    </main>
  );
};
