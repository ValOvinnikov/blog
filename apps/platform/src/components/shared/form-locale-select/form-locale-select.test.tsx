import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FormLocaleSelect } from './form-locale-select';

faker.seed(7123);

const { languageNames } = en;
const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_HINT = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();

const setup = customRender(FormLocaleSelect, {
  label: MOCK_LABEL,
  hint: MOCK_HINT,
  value: EN,
  onChange: vi.fn(),
});

describe(`<${FormLocaleSelect.name}/>`, () => {
  let user: UserEvent;

  const getSelect = () => screen.getByRole('combobox', { name: MOCK_LABEL });

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the chosen language by name and describes the select by its hint', () => {
    setup();

    const select = getSelect();

    expect(select).toHaveTextContent(languageNames[EN]);
    expect(select).toHaveAccessibleDescription(MOCK_HINT);
  });

  it('offers every supported language by name', async () => {
    setup();

    await user.click(getSelect());
    const options = await screen.findAllByRole('option');

    expect(options.map((option) => option.textContent)).toEqual(
      Object.values(LOCALE_ISO_CODES).map((locale) => languageNames[locale]),
    );
  });

  it('reports the language chosen from the list', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    await user.click(getSelect());
    const dutch = await screen.findByRole('option', {
      name: languageNames[NL],
    });
    await user.click(dutch);

    expect(onChange).toHaveBeenCalledWith(NL);
  });

  it('marks the select invalid and describes it by its hint and error', () => {
    setup({ error: MOCK_ERROR });

    const select = getSelect();

    expect(select).toBeInvalid();
    expect(select).toHaveAccessibleDescription(`${MOCK_HINT} ${MOCK_ERROR}`);
  });
});
