'use client';

import type {
  TCapability,
  TLocaleIsoCode,
  TSanityLoginProvider,
} from '@blog/config/constants';
import type { ThemeColorSchemeKey } from '@sanity/ui';
import { type FC, type RefObject, useEffect, useRef, useState } from 'react';
import {
  StudioLayout,
  StudioProvider,
  type StudioThemeColorSchemeKey,
  useCurrentUser,
} from 'sanity';

import { buildStudioConfig, type TStudioEntitlements } from './studio-config';

export type TStudioMountProps = {
  projectId: string;
  dataset: string;
  basePath: string;
  title: string;
  enabledCapabilities?: readonly TCapability[];
  entitlements?: TStudioEntitlements;
  defaultLocale?: TLocaleIsoCode;
  liveLocales?: readonly TLocaleIsoCode[];
  loginProvider?: TSanityLoginProvider;
  scheme?: ThemeColorSchemeKey;
  onSchemeChange?: (nextScheme: StudioThemeColorSchemeKey) => void;
  onSignedIn?: () => void;
};

type TSignedInSignalProps = {
  onSignedIn: () => void;
  hasSignalledRef: RefObject<boolean>;
};

const SignedInSignal: FC<TSignedInSignalProps> = ({
  onSignedIn,
  hasSignalledRef,
}) => {
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (!currentUser || hasSignalledRef.current) return;
    hasSignalledRef.current = true;
    onSignedIn();
  }, [currentUser, onSignedIn, hasSignalledRef]);

  return null;
};

// Unlike next-sanity's NextStudio, fills the parent slot instead of hardcoding 100vh.
const containerStyle = { height: '100%' };

/**
 * The only file in this package carrying `'use client'`. It must be the one
 * that *calls* `buildStudioConfig` — a Server Component calling the builder
 * and passing the config object out pulls the Sanity SDK into the RSC server
 * graph, where it breaks under the `react-server` export condition. Callers
 * pass only plain strings.
 */
export const StudioMount: FC<TStudioMountProps> = ({
  projectId,
  dataset,
  basePath,
  title,
  enabledCapabilities,
  entitlements,
  defaultLocale,
  liveLocales,
  loginProvider,
  scheme,
  onSchemeChange,
  onSignedIn,
}) => {
  const params = {
    projectId,
    dataset,
    basePath,
    title,
    enabledCapabilities,
    entitlements,
    defaultLocale,
    liveLocales,
    loginProvider,
  };
  // Keyed by value: a new config makes Sanity re-resolve the workspace and
  // reset pane state, and callers pass fresh arrays on every render.
  const paramsKey = JSON.stringify(params);
  const [built, setBuilt] = useState(() => ({
    paramsKey,
    config: buildStudioConfig(params),
  }));
  if (built.paramsKey !== paramsKey) {
    setBuilt({ paramsKey, config: buildStudioConfig(params) });
  }
  // Survives the provider remounting its subtree when the config is rebuilt.
  const hasSignalledRef = useRef(false);

  return (
    <div style={containerStyle}>
      <StudioProvider
        config={built.config}
        scheme={scheme}
        onSchemeChange={onSchemeChange}
      >
        <StudioLayout />
        {onSignedIn && (
          <SignedInSignal
            onSignedIn={onSignedIn}
            hasSignalledRef={hasSignalledRef}
          />
        )}
      </StudioProvider>
    </div>
  );
};
