import {
  alignmentFields,
  type TAlignmentFieldsOptions,
} from '@shinefold/studio/schema-types/fields/alignment-fields/alignment-fields';
import { cardFields } from '@shinefold/studio/schema-types/fields/appearance-fields/card-fields';
import { brandVariantField } from '@shinefold/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import {
  displayModeField,
  isCarouselMode,
  type TDisplayModeFieldOptions,
} from '@shinefold/studio/schema-types/fields/display-mode-field/display-mode-field';
import { wideLayoutField } from '@shinefold/studio/schema-types/objects/wide-layout/wide-layout-field';
import type {
  FieldDefinition,
  FieldGroupDefinition,
  FieldsetDefinition,
} from 'sanity';

const CONTENT_GROUP = {
  name: 'content',
  title: 'Content',
  default: true,
} satisfies FieldGroupDefinition;

const APPEARANCE_GROUP = {
  name: 'appearance',
  title: 'Appearance',
} satisfies FieldGroupDefinition;

export const CARDS_FIELDSET = {
  name: 'cards',
  title: 'Cards',
  options: { collapsible: true, collapsed: false },
} satisfies FieldsetDefinition;

type TCardModuleAppearanceOptions = {
  content: readonly FieldDefinition[];
  fieldsets?: readonly FieldsetDefinition[];
  beforeDisplayMode?: readonly FieldDefinition[];
  displayMode?: boolean | TDisplayModeFieldOptions;
  headingAlignment?: Omit<TAlignmentFieldsOptions, 'title'>;
  afterHeadingAlignment?: readonly FieldDefinition[];
  layout?: FieldDefinition;
  hasColumns?: boolean;
};

const inGroup =
  ({ name }: FieldGroupDefinition) =>
  (field: FieldDefinition): FieldDefinition => ({ ...field, group: name });

const inFieldset =
  ({ name }: FieldsetDefinition) =>
  (field: FieldDefinition): FieldDefinition => ({ ...field, fieldset: name });

export const cardsFieldsetFields = (
  ...args: Parameters<typeof cardFields>
): FieldDefinition[] => cardFields(...args).map(inFieldset(CARDS_FIELDSET));

type TModuleAppearanceOptions = {
  content: readonly FieldDefinition[];
  appearance: readonly FieldDefinition[];
  fieldsets?: readonly FieldsetDefinition[];
};

export const moduleAppearance = ({
  content,
  appearance,
  fieldsets = [],
}: TModuleAppearanceOptions) => ({
  fieldsets: [...fieldsets],
  groups: [CONTENT_GROUP, APPEARANCE_GROUP],
  fields: [
    ...content.map(inGroup(CONTENT_GROUP)),
    ...appearance.map(inGroup(APPEARANCE_GROUP)),
  ],
});

const displayModeFields = (
  displayMode: TCardModuleAppearanceOptions['displayMode'],
) => {
  if (!displayMode) return [];

  return [displayModeField(displayMode === true ? undefined : displayMode)];
};

export const cardModuleAppearance = ({
  content,
  fieldsets = [],
  beforeDisplayMode = [],
  displayMode = false,
  headingAlignment,
  afterHeadingAlignment = [],
  layout = wideLayoutField,
  hasColumns = true,
}: TCardModuleAppearanceOptions) =>
  moduleAppearance({
    content,
    fieldsets: [...fieldsets, CARDS_FIELDSET],
    appearance: [
      brandVariantField(),
      ...beforeDisplayMode,
      ...displayModeFields(displayMode),
      ...alignmentFields([], {
        ...headingAlignment,
        title: 'Heading Alignment',
      }),
      ...afterHeadingAlignment,
      ...cardsFieldsetFields(
        hasColumns,
        displayMode ? isCarouselMode : undefined,
      ),
      layout,
    ],
  });
