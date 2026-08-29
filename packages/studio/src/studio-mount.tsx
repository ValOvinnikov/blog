'use client';

import type { FC } from 'react';
import { StudioLayout, StudioProvider } from 'sanity';

import { buildStudioConfig } from './studio-config';

export type TStudioMountProps = {
  projectId: string;
  dataset: string;
  basePath: string;
  title: string;
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
}) => {
  const config = buildStudioConfig({ projectId, dataset, basePath, title });

  return (
    <div style={containerStyle}>
      <StudioProvider config={config}>
        <StudioLayout />
      </StudioProvider>
    </div>
  );
};
