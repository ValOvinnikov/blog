import { schemaTypes } from '@blog/studio/schema-types';
import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state';
import { codeInput } from '@sanity/code-input';
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';

import { studioStructure } from './studio-structure';

export type TBuildStudioConfigParams = {
  projectId: string;
  dataset: string;
  basePath?: string;
  title: string;
};

/**
 * Builds the full Studio config — schema, desk structure and plugins — shared
 * by every entry point (`sanity.config.ts` for the CLI, and the mount
 * component for `apps/platform`). Kept directive-free so it can be called
 * from both a plain Sanity CLI context and from behind a `'use client'`
 * boundary without duplicating the desk structure.
 */
export const buildStudioConfig = ({
  projectId,
  dataset,
  basePath,
  title,
}: TBuildStudioConfigParams) =>
  defineConfig({
    name: 'default',
    title,
    projectId,
    dataset,
    basePath,

    plugins: [
      structureTool({ structure: studioStructure }),
      visionTool(),
      codeInput(),
      media(),
    ],

    schema: {
      types: schemaTypes,
    },

    // migrationState is a system ledger, not authorable content — never
    // creatable/editable and never listed in the new-document menu.
    document: {
      actions: (prev, { schemaType }) =>
        schemaType === migrationStateSchema.name ? [] : prev,
      newDocumentOptions: (prev) =>
        prev.filter((item) => item.templateId !== migrationStateSchema.name),
    },
  });
