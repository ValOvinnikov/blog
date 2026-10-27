import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { createSingleLanguageInput } from '@blog/studio/schema-types/inputs/single-language-input/single-language-input';
import { ArrayOfObjectsInputMember, type InputProps } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const LOCALIZED_STRING_SCHEMA_TYPE = {
  name: 'internationalizedArrayString',
  jsonType: 'array',
  of: [{ name: 'internationalizedArrayStringValue', jsonType: 'object' }],
};
const STRING_SCHEMA_TYPE = { name: 'string', jsonType: 'string' };

const mockItemMember = (language: TLocaleIsoCode) => ({
  kind: 'item',
  key: language,
  item: { value: { _key: language, language } },
});

const mockInputProps = (schemaType: object, members?: unknown[]) => {
  const renderDefault = vi.fn(() => null);

  return {
    props: { schemaType, members, renderDefault } as unknown as InputProps,
    renderDefault,
  };
};

describe(createSingleLanguageInput, () => {
  it('renders the default language value as a plain field with one live language', () => {
    const defaultMember = mockItemMember(EN);
    const { props, renderDefault } = mockInputProps(
      LOCALIZED_STRING_SCHEMA_TYPE,
      [defaultMember],
    );

    const rendered = createSingleLanguageInput([EN], EN)(props);
    const {
      type: renderedType,
      props: { member: renderedMember },
    } = rendered as { type: unknown; props: { member: unknown } };

    expect(renderDefault).not.toHaveBeenCalled();
    expect(renderedType).toBe(ArrayOfObjectsInputMember);
    expect(renderedMember).toBe(defaultMember);
  });

  it.each([
    {
      behaviour: 'with two live languages',
      liveLocales: [EN, NL],
      schemaType: LOCALIZED_STRING_SCHEMA_TYPE,
      members: [mockItemMember(EN), mockItemMember(NL)],
    },
    {
      behaviour: 'until the default language value exists',
      liveLocales: [EN],
      schemaType: LOCALIZED_STRING_SCHEMA_TYPE,
      members: [],
    },
    {
      behaviour: 'for an untranslated field with one live language',
      liveLocales: [EN],
      schemaType: STRING_SCHEMA_TYPE,
      members: undefined,
    },
  ])(
    'renders the standard input $behaviour',
    ({ liveLocales, schemaType, members }) => {
      const { props, renderDefault } = mockInputProps(schemaType, members);

      createSingleLanguageInput(liveLocales, EN)(props);

      expect(renderDefault).toHaveBeenCalledWith(props);
    },
  );
});
