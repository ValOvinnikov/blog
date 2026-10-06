import type { TLocaleIsoCode } from '@blog/config/constants';
import { isLocalizedSchemaType } from '@blog/studio/schema-types/inputs/localization-notice-input/is-localized-schema-type';
import { isSingleLanguage } from '@blog/studio/structure/locales/is-single-language';
import {
  ArrayOfObjectsInputMember,
  type ArrayOfObjectsItemMember,
  type ArrayOfObjectsMember,
  type InputProps,
  isArrayOfObjectsInputProps,
  type ObjectMember,
  type RenderArrayOfObjectsItemCallback,
} from 'sanity';

const VALUE_FIELD_NAME = 'value';

const withoutTitle = (member: ObjectMember): ObjectMember =>
  member.kind === 'field'
    ? {
        ...member,
        field: {
          ...member.field,
          schemaType: { ...member.field.schemaType, title: undefined },
        },
      }
    : member;

const isLanguageItem =
  (locale: TLocaleIsoCode) =>
  (member: ArrayOfObjectsMember): member is ArrayOfObjectsItemMember =>
    member.kind === 'item' &&
    (member.item.value as { language?: unknown } | undefined)?.language ===
      locale;

const renderPlainValue: RenderArrayOfObjectsItemCallback = ({ inputProps }) => {
  const plainInputProps = {
    ...inputProps,
    members: inputProps.members
      .filter(
        (member) => member.kind === 'field' && member.name === VALUE_FIELD_NAME,
      )
      .map(withoutTitle),
  };

  return inputProps.renderInput(plainInputProps);
};

export const createSingleLanguageInput = (
  liveLocales: readonly TLocaleIsoCode[],
  defaultLocale: TLocaleIsoCode,
) => {
  const hasSingleLanguage = isSingleLanguage(liveLocales);
  const isDefaultLanguageItem = isLanguageItem(defaultLocale);

  return function SingleLanguageInput(props: InputProps) {
    if (
      !hasSingleLanguage ||
      !isArrayOfObjectsInputProps(props) ||
      !isLocalizedSchemaType(props.schemaType)
    ) {
      return props.renderDefault(props);
    }

    const defaultLanguageMember = props.members.find(isDefaultLanguageItem);
    if (!defaultLanguageMember) return props.renderDefault(props);

    return (
      <ArrayOfObjectsInputMember
        member={defaultLanguageMember}
        renderAnnotation={props.renderAnnotation}
        renderBlock={props.renderBlock}
        renderField={props.renderField}
        renderInlineBlock={props.renderInlineBlock}
        renderInput={props.renderInput}
        renderItem={renderPlainValue}
        renderPreview={props.renderPreview}
      />
    );
  };
};
