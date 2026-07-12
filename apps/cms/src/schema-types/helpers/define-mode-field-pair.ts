import { HERO_FIELD_MODE, type THeroFieldMode } from '@blog/config/constants';
import { defineField } from 'sanity';

/** Parent shape shared by any object using mode/custom field pairs (e.g. `module_hero`). */
export type TModeFieldPairParent = Record<string, THeroFieldMode | undefined>;

export const isMode = (
  parent: unknown,
  key: string,
  mode: THeroFieldMode,
): boolean => (parent as TModeFieldPairParent | undefined)?.[key] === mode;

type TModeFieldPair = {
  /** Base field name — the mode field is `${name}Mode`. */
  name: string;
  title: string;
  description: string;
  modeOptions: { title: string; value: THeroFieldMode }[];
  customType?: 'string' | 'text' | 'imageWithAlt';
  rows?: number;
};

/**
 * Builds a "mode + custom value" field pair: a required radio field
 * (`${name}Mode`) choosing the content source, plus a `${name}` field that is
 * hidden unless the mode is `custom`, required only in that case.
 */
export const defineModeFieldPair = ({
  name,
  title,
  description,
  modeOptions,
  customType = 'string',
  rows,
}: TModeFieldPair) => {
  const modeName = `${name}Mode`;

  const hidden = ({ parent }: { parent?: unknown }) =>
    !isMode(parent, modeName, HERO_FIELD_MODE.CUSTOM);

  const requiredWhenCustom = (value: unknown, context: { parent?: unknown }) =>
    isMode(context.parent, modeName, HERO_FIELD_MODE.CUSTOM) && !value
      ? `Custom ${title.toLowerCase()} is required when ${title} Source is Custom.`
      : true;

  const customField =
    customType === 'text'
      ? defineField({
          name,
          title: `Custom ${title}`,
          type: 'text',
          rows,
          hidden,
          validation: (rule) => rule.custom(requiredWhenCustom),
        })
      : customType === 'imageWithAlt'
        ? defineField({
            name,
            title: `Custom ${title}`,
            type: 'imageWithAlt',
            hidden,
            validation: (rule) => rule.custom(requiredWhenCustom),
          })
        : defineField({
            name,
            title: `Custom ${title}`,
            type: 'string',
            hidden,
            validation: (rule) => rule.custom(requiredWhenCustom),
          });

  return [
    defineField({
      name: modeName,
      title: `${title} Source`,
      type: 'string',
      description,
      options: {
        layout: 'radio',
        list: modeOptions,
      },
      validation: (rule) => rule.required(),
    }),
    customField,
  ];
};
