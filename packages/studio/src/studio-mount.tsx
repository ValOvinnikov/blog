'use client';

import { NextStudio } from 'next-sanity/studio';
import type { FC } from 'react';

import { buildStudioConfig } from './studio-config';

export type TStudioMountProps = {
  projectId: string;
  dataset: string;
  basePath: string;
  title: string;
};

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

  return <NextStudio config={config} />;
};
