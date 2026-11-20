import {
  SAMPLE_KIND,
  type TSampleKind,
} from '@platform/constants/sample-content';
import { z } from 'zod';

export type TKeptSample = { id: string; kind: TSampleKind; title?: string };

const keptSampleSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string().optional(),
});

export const sampleRemovalResponseSchema = z.object({
  removed: z.array(z.string()),
  keptEdited: z.array(keptSampleSchema),
  keptReferenced: z.array(keptSampleSchema),
});

const KIND_BY_TYPE_PREFIX = [
  ['module_', SAMPLE_KIND.SECTION],
  ['page_', SAMPLE_KIND.PAGE],
  ['template_', SAMPLE_KIND.TEMPLATE],
] as const;

const KIND_BY_TYPE: Record<string, TSampleKind> = {
  link: SAMPLE_KIND.LINK,
  person: SAMPLE_KIND.AUTHOR,
  blog_topic: SAMPLE_KIND.TOPIC,
};

const kindOf = (type: string): TSampleKind =>
  KIND_BY_TYPE[type] ??
  KIND_BY_TYPE_PREFIX.find(([prefix]) => type.startsWith(prefix))?.[1] ??
  SAMPLE_KIND.OTHER;

export const toKeptSample = ({
  id,
  type,
  title,
}: z.infer<typeof keptSampleSchema>): TKeptSample => ({
  id,
  kind: kindOf(type),
  ...(title && { title }),
});
