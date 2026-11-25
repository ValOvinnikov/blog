import { localizedOneLineTextField } from '@shinefold/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { validateLocalizedMaxLength } from '@shinefold/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';

const FOOTNOTE_MAX_LENGTH = 120;

export const footnoteField = () =>
  localizedOneLineTextField({
    name: 'footnote',
    title: 'Footnote',
    description: 'Small print below the actions.',
    validation: (rule) =>
      rule.custom(
        validateLocalizedMaxLength(
          FOOTNOTE_MAX_LENGTH,
          `Keep each footnote to ${FOOTNOTE_MAX_LENGTH} characters or fewer.`,
        ),
      ),
  });
