import { cardFields } from '@blog/studio/schema-types/fields/appearance-fields/card-fields';
import type {
  FieldDefinition,
  FieldGroupDefinition,
  FieldsetDefinition,
  StringDefinition,
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

export const appearanceFieldGroups = [CONTENT_GROUP, APPEARANCE_GROUP];

const CARDS_FIELDSET = {
  name: 'cards',
  title: 'Cards',
  options: { collapsible: true, collapsed: false },
} satisfies FieldsetDefinition;

export const appearanceFieldsets = [CARDS_FIELDSET];

type TAppearanceFieldsOptions = {
  content: readonly FieldDefinition[];
  appearance: readonly FieldDefinition[];
  layout: FieldDefinition;
  hasColumns?: boolean;
  columnsHidden?: StringDefinition['hidden'];
};

const inGroup =
  ({ name }: FieldGroupDefinition) =>
  (field: FieldDefinition): FieldDefinition => ({ ...field, group: name });

const inFieldset =
  ({ name }: FieldsetDefinition) =>
  (field: FieldDefinition): FieldDefinition => ({ ...field, fieldset: name });

export const appearanceFields = ({
  content,
  appearance,
  layout,
  hasColumns = true,
  columnsHidden,
}: TAppearanceFieldsOptions) => [
  ...content.map(inGroup(CONTENT_GROUP)),
  ...[
    ...appearance,
    ...cardFields(hasColumns, columnsHidden).map(inFieldset(CARDS_FIELDSET)),
    layout,
  ].map(inGroup(APPEARANCE_GROUP)),
];
