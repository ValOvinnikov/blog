'use client';

import type {
  TCapability,
  TLocaleIsoCode,
  TSanityLoginProvider,
} from '@blog/config/constants';
import { type FC, type RefObject, useEffect, useRef, useState } from 'react';
import {
  StudioLayout,
  StudioProvider,
  type StudioThemeColorSchemeKey,
  useCurrentUser,
} from 'sanity';

import { buildStudioConfig } from './studio-config';
import type { TStudioEntitlements } from './studio-config-params';

export type TStudioMountProps = {
  projectId: string;
  dataset: string;
  basePath: string;
  title: string;
  enabledCapabilities?: readonly TCapability[];
  entitlements?: TStudioEntitlements;
  canLinkPlatformPlans?: boolean;
  defaultLocale?: TLocaleIsoCode;
  liveLocales?: readonly TLocaleIsoCode[];
  loginProvider?: TSanityLoginProvider;
  scheme?: StudioThemeColorSchemeKey;
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

// The one caller of `buildStudioConfig`: building it in a Server Component drags the Sanity SDK into the RSC graph.
export const StudioMount: FC<TStudioMountProps> = ({
  projectId,
  dataset,
  basePath,
  title,
  enabledCapabilities,
  entitlements,
  canLinkPlatformPlans,
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
    canLinkPlatformPlans,
    defaultLocale,
    liveLocales,
    loginProvider,
  };
  // Keyed by value: callers pass fresh arrays each render, and a new config resets Sanity's pane state.
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
