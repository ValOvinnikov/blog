import { TIMELINE_MARKER_STYLE } from '@blog/config/constants';
import type { TTimelineDocument } from '@blog/studio/schema-types/modules/timeline/timeline-document';
import { paragraphTextSchema } from '@blog/studio/schema-types/portable-text/paragraph-text/paragraph-text';
import { validateTimelineMarkerRequired } from '@blog/studio/schema-types/validation/validate-timeline-marker-required/validate-timeline-marker-required';
import { CircleDot } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const isNumbered = (document: unknown): boolean =>
  (document as TTimelineDocument | undefined)?.markerStyle ===
  TIMELINE_MARKER_STYLE.NUMBERED;

type TParagraphBlock = { children?: { text?: string }[] };

const BODY_MAX_LENGTH = 300;

const plainTextLength = (blocks: TParagraphBlock[] | undefined): number =>
  (blocks ?? [])
    .flatMap((block) => block.children ?? [])
    .map((child) => child.text ?? '')
    .join(' ')
    .trim().length;

export const timelineItemSchema = defineType({
  name: 'timelineItem',
  title: 'Timeline Item',
  type: 'object',
  description:
    'One step or milestone on a timeline, with its own marker, heading and text.',
  icon: CircleDot,
  fields: [
    defineField({
      name: 'marker',
      title: 'Marker',
      type: 'string',
      description: 'A short label on the line: a year, a quarter, "Week 1".',
      hidden: ({ document }) => isNumbered(document),
      validation: (rule) => [
        rule.custom(validateTimelineMarkerRequired),
        rule.max(16).error('Keep the marker under 16 characters.'),
      ],
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'What happens at this step, in a few words.',
      validation: (rule) => [
        rule.required().error('Give the item a heading.'),
        rule.max(80).error('Keep the heading under 80 characters.'),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: paragraphTextSchema.name,
      description: 'A sentence or two describing this step or milestone.',
      validation: (rule) =>
        rule
          .custom((blocks: TParagraphBlock[] | undefined) =>
            plainTextLength(blocks) > BODY_MAX_LENGTH
              ? "An item's text reads best as a sentence or two."
              : true,
          )
          .warning(),
    }),
  ],
  preview: {
    select: {
      marker: 'marker',
      heading: 'heading',
    },
    prepare({ marker, heading }: { marker?: string; heading?: string }) {
      return {
        title: heading ?? 'Untitled',
        subtitle: marker,
      };
    },
  },
});
