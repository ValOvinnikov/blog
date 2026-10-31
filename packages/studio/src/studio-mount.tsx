'use client';

import type {
  TCapability,
  TLocaleIsoCode,
  TSanityLoginProvider,
} from '@blog/config/constants';
import type { ThemeColorSchemeKey } from '@sanity/ui';
import { type FC, useState } from 'react';
import {
  StudioLayout,
  StudioProvider,
  type StudioThemeColorSchemeKey,
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
};

// Fills the parent slot instead of assuming the viewport, unlike
// next-sanity's NextStudio (which hardcodes 100vh and also injects
// document-scoped global styles we don't want here).
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

  return (
    <div style={containerStyle}>
      <StudioProvider
        config={built.config}
        scheme={scheme}
        onSchemeChange={onSchemeChange}
      >
        <StudioLayout />
      </StudioProvider>
    </div>
  );
};
