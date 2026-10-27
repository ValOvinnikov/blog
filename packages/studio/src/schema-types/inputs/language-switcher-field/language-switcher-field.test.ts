import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { LANGUAGE_SWITCHER_FIELD_NAME } from '@blog/studio/schema-types/fields/language-switcher-field/language-switcher-field';
import { createLanguageSwitcherField } from '@blog/studio/schema-types/inputs/language-switcher-field/language-switcher-field';
import { faker } from '@faker-js/faker';
import type { FieldProps } from 'sanity';

faker.seed(4105);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_FIELD_NAME = faker.lorem.word();

const mockFieldProps = (name: string) => {
  const renderDefault = vi.fn(() => null);

  return {
    props: { name, renderDefault } as unknown as FieldProps,
    renderDefault,
  };
};

describe(createLanguageSwitcherField, () => {
  let props: FieldProps;
  let renderDefault: ReturnType<typeof mockFieldProps>['renderDefault'];

  describe('the language switcher toggle', () => {
    beforeEach(() => {
      ({ props, renderDefault } = mockFieldProps(LANGUAGE_SWITCHER_FIELD_NAME));
    });

    it('is hidden with one live language', () => {
      createLanguageSwitcherField([EN])(props);

      expect(renderDefault).not.toHaveBeenCalled();
    });

    it('is shown with two live languages', () => {
      createLanguageSwitcherField([EN, NL])(props);

      expect(renderDefault).toHaveBeenCalledWith(props);
    });
  });

  describe('any other field', () => {
    beforeEach(() => {
      ({ props, renderDefault } = mockFieldProps(MOCK_FIELD_NAME));
    });

    it('is shown with one live language', () => {
      createLanguageSwitcherField([EN])(props);

      expect(renderDefault).toHaveBeenCalledWith(props);
    });
  });
});
