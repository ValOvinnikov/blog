import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';

import { UnsavedDot } from './unsaved-dot';

const { fieldStatus } = messages;

const MOCK_LABEL = faker.lorem.words(2);

const setup = customRender(UnsavedDot, {});

describe(`<${UnsavedDot.name}/>`, () => {
  it('announces itself as unsaved by default', () => {
    setup();

    const dot = screen.getByRole('img', { name: fieldStatus.unsaved });

    expect(dot).toBeEmptyDOMElement();
  });

  it('announces exactly the given label', () => {
    setup({ label: MOCK_LABEL });

    const dot = screen.getByRole('img', { name: MOCK_LABEL });
    const defaultName = screen.queryByRole('img', {
      name: fieldStatus.unsaved,
    });

    expect(dot).toBeInTheDocument();
    expect(defaultName).not.toBeInTheDocument();
  });

  it('stays out of the accessibility tree when decorative', () => {
    setup({ isDecorative: true });

    const image = screen.queryByRole('img');
    const text = screen.queryByText(fieldStatus.unsaved);

    expect(image).not.toBeInTheDocument();
    expect(text).not.toBeInTheDocument();
  });
});
