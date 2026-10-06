import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { ArrayOfObjectsInputMember, type InputProps } from 'sanity';

import { createSingleLanguageInput } from './single-language-input';

const { EN, NL } = LOCALE_ISO_CODES;

const itemMember = (language: string) => ({
  kind: 'item',
  key: language,
  item: { value: { _key: language, language } },
});

const localizedInputProps = (members: unknown[]) => {
  const renderDefault = vi.fn(() => null);

  return {
    props: {
      schemaType: {
        name: 'internationalizedArrayString',
        jsonType: 'array',
        of: [{ name: 'internationalizedArrayStringValue', jsonType: 'object' }],
      },
      members,
      renderDefault,
    } as unknown as InputProps,
    renderDefault,
  };
};

describe(createSingleLanguageInput, () => {
  it('renders the default language value as a plain field with one live language', () => {
    const defaultMember = itemMember(EN);
    const { props, renderDefault } = localizedInputProps([defaultMember]);

    const rendered = createSingleLanguageInput([EN], EN)(props);

    expect(renderDefault).not.toHaveBeenCalled();
    expect(rendered).toMatchObject({
      type: ArrayOfObjectsInputMember,
      props: { member: defaultMember },
    });
  });

  it('renders the translated input with two live languages', () => {
    const { props, renderDefault } = localizedInputProps([
      itemMember(EN),
      itemMember(NL),
    ]);

    createSingleLanguageInput([EN, NL], EN)(props);

    expect(renderDefault).toHaveBeenCalledWith(props);
  });

  it('renders the translated input until the default language value exists', () => {
    const { props, renderDefault } = localizedInputProps([]);

    createSingleLanguageInput([EN], EN)(props);

    expect(renderDefault).toHaveBeenCalledWith(props);
  });

  it('leaves untranslated fields alone with one live language', () => {
    const renderDefault = vi.fn(() => null);
    const props = {
      schemaType: { name: 'string', jsonType: 'string' },
      renderDefault,
    } as unknown as InputProps;

    createSingleLanguageInput([EN], EN)(props);

    expect(renderDefault).toHaveBeenCalledWith(props);
  });
});
