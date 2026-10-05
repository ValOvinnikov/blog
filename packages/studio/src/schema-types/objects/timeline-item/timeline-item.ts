import { TIMELINE_MARKER_STYLE } from '@blog/config/constants';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { localizedParagraphTextField } from '@blog/studio/schema-types/fields/localized-paragraph-text-field/localized-paragraph-text-field';
import type { TTimelineDocument } from '@blog/studio/schema-types/modules/timeline/timeline-document';
import {
  toPlainText,
  type TPlainTextBlock,
} from '@blog/studio/schema-types/portable-text/to-plain-text/to-plain-text';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { validateTimelineMarkerRequired } from '@blog/studio/schema-types/validation/validate-timeline-marker-required/validate-timeline-marker-required';
import { CircleDot } from 'lucide-react';
import { defineType } from 'sanity';

const isNumbered = (document: unknown): boolean =>
  (document as TTimelineDocument | undefined)?.markerStyle ===
  TIMELINE_MARKER_STYLE.NUMBERED;

const MARKER_MAX_LENGTH = 16;
const HEADING_MAX_LENGTH = 80;
const BODY_MAX_LENGTH = 300;

const isAnyBodyTooLong = (value: unknown) =>
  Array.isArray(value) &&
  value.some(
    (entry) =>
      toPlainText((entry as { value?: TPlainTextBlock[] } | null)?.value ?? [])
        .length > BODY_MAX_LENGTH,
  );

export const timelineItemSchema = defineType({
  name: 'timelineItem',
  title: 'Timeline Item',
  type: 'object',
  description:
    'One step or milestone on a timeline, with its own marker, heading and text.',
  icon: CircleDot,
  fields: [
    localizedOneLineTextField({
      name: 'marker',
      title: 'Marker',
      description:
        'A short label on the line, per language: a year, a quarter, "Week 1".',
      hidden: ({ document }) => isNumbered(document),
      validation: (rule) => [
        rule.custom(validateTimelineMarkerRequired),
        rule.custom(
          validateLocalizedMaxLength(
            MARKER_MAX_LENGTH,
            `Keep the marker under ${MARKER_MAX_LENGTH} characters.`,
          ),
        ),
      ],
    }),
    localizedOneLineTextField({
      name: 'heading',
      title: 'Heading',
      description: 'What happens at this step, in a few words, per language.',
      validation: (rule) => [
        rule.custom(validateDefaultLanguageFilled('Give the item a heading.')),
        rule.custom(
          validateLocalizedMaxLength(
            HEADING_MAX_LENGTH,
            `Keep the heading under ${HEADING_MAX_LENGTH} characters.`,
          ),
        ),
      ],
    }),
    localizedParagraphTextField({
      name: 'body',
      title: 'Body',
      description:
        'A sentence or two describing this step or milestone, per language.',
      validation: (rule) =>
        rule
          .custom((value) =>
            isAnyBodyTooLong(value)
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
    prepare({ marker, heading }: { marker?: unknown; heading?: unknown }) {
      return {
        title: defaultLanguageValue(heading) ?? 'Untitled',
        subtitle: defaultLanguageValue(marker),
      };
    },
  },
});
