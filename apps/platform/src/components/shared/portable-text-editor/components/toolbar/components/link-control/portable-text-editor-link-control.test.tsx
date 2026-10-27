import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PortableTextEditorLinkControl } from './portable-text-editor-link-control';

faker.seed(5995);

const t = makeEnTranslator('portableTextEditorToolbar');

const MOCK_URL = faker.internet.url();
const MOCK_INVALID_URL = faker.lorem.words(3);

const onApplyMock = vi.fn();

const setup = customRender(PortableTextEditorLinkControl, {
  id: faker.string.alpha(8),
  initialHref: '',
  hasExistingLink: false,
  onApply: onApplyMock,
  onRemove: vi.fn(),
  onCancel: vi.fn(),
});

describe(`<${PortableTextEditorLinkControl.name}/>`, () => {
  let user: UserEvent;
  let urlInput: HTMLElement;
  let applyButton: HTMLElement;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
    urlInput = screen.getByRole('textbox', { name: t('linkUrlLabel') });
    applyButton = screen.getByRole('button', { name: t('linkApply') });
  });

  it('applies a trimmed URL on submit', async () => {
    await user.type(urlInput, ` ${MOCK_URL} `);
    await user.click(applyButton);

    expect(onApplyMock).toHaveBeenCalledWith(MOCK_URL);
  });

  it('keeps focus on an invalid URL, marks it invalid and does not apply it', async () => {
    await user.type(urlInput, MOCK_INVALID_URL);
    await user.click(applyButton);

    expect(onApplyMock).not.toHaveBeenCalled();
    expect(urlInput).toHaveFocus();
    expect(urlInput).toHaveAttribute('aria-invalid', 'true');
  });
});
