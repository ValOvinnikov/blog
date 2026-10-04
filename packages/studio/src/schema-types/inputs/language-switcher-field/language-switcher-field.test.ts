import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { FieldProps } from 'sanity';

import { createLanguageSwitcherField } from './language-switcher-field';

const { EN, NL } = LOCALE_ISO_CODES;

const fieldProps = (name: string) => {
  const renderDefault = vi.fn(() => null);

  return {
    props: { name, renderDefault } as unknown as FieldProps,
    renderDefault,
  };
};

describe(createLanguageSwitcherField, () => {
  it('hides the language switcher toggle with one live language', () => {
    const { props, renderDefault } = fieldProps('showLanguageSwitcher');

    createLanguageSwitcherField([EN])(props);

    expect(renderDefault).not.toHaveBeenCalled();
  });

  it('shows the language switcher toggle with two live languages', () => {
    const { props, renderDefault } = fieldProps('showLanguageSwitcher');

    createLanguageSwitcherField([EN, NL])(props);

    expect(renderDefault).toHaveBeenCalledWith(props);
  });

  it('leaves other fields alone with one live language', () => {
    const { props, renderDefault } = fieldProps('title');

    createLanguageSwitcherField([EN])(props);

    expect(renderDefault).toHaveBeenCalledWith(props);
  });
});
