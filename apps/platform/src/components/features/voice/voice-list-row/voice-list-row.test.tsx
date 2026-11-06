import { VOICE_FIELDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { Accordion } from '@platform/components/shared/accordion';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { TAG_ROW, UNSAVED_MARK } from '@platform/testing/voice/fixtures';
import type { ComponentProps } from 'react';

import { VoiceListRow } from './voice-list-row';

faker.seed(5994);

const MOCK_VALUE = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();
const ARIA_EXPANDED = 'aria-expanded';

const tagEmpty = VOICE_FIELDS.find(({ id }) => id === 'tagEmpty')!;

const setup = (overrides: Partial<ComponentProps<typeof VoiceListRow>> = {}) =>
  renderWithIntl(
    <Accordion
      openValue={overrides.isOpen ? 'tagEmpty' : undefined}
      onOpenValueChange={vi.fn()}
    >
      <VoiceListRow
        field={tagEmpty}
        locale={LOCALE_ISO_CODES.EN}
        value={null}
        savedValue={null}
        isOpen={false}
        {...overrides}
      >
        <p>Editor</p>
      </VoiceListRow>
    </Accordion>,
  );

describe(`<${VoiceListRow.name}/>`, () => {
  it('summarises a closed list with its route, default text and status', () => {
    setup();

    const row = screen.getByRole('button', { name: TAG_ROW });

    expect(row).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(row).toHaveTextContent('Shown at /tags/…');
    expect(row).toHaveTextContent('Default');
  });

  it('names the list with a button inside an h4', () => {
    setup();

    const heading = screen.getByRole('heading', { level: 4, name: TAG_ROW });
    const row = screen.getByRole('button', { name: TAG_ROW });

    expect(heading).toContainElement(row);
  });

  it('summarises a customised value and announces that it is unsaved', () => {
    setup({ value: MOCK_VALUE });

    const row = screen.getByRole('button', { name: TAG_ROW });

    expect(row).toHaveTextContent(MOCK_VALUE);
    const unsavedMark = within(row).getByRole('img', { name: UNSAVED_MARK });

    expect(unsavedMark).toBeVisible();
    expect(row).toHaveTextContent('Customised');
  });

  it('describes a closed list with its error in text', () => {
    setup({ error: MOCK_ERROR });

    const row = screen.getByRole('button', { name: TAG_ROW });
    const errorText = screen.getByText(MOCK_ERROR);

    expect(row).toHaveAccessibleDescription(MOCK_ERROR);
    expect(errorText).toBeVisible();
  });

  it('leaves the error to the open editor', () => {
    setup({ isOpen: true, error: MOCK_ERROR });

    const row = screen.getByRole('button', { name: TAG_ROW });
    const errorText = screen.queryByText(MOCK_ERROR);

    expect(row).not.toHaveAccessibleDescription();
    expect(errorText).not.toBeInTheDocument();
  });

  it('keeps its summary and status beside its editor when open', () => {
    setup({ isOpen: true, value: MOCK_VALUE, savedValue: null });

    const row = screen.getByRole('button', { name: TAG_ROW });
    const editor = screen.getByText('Editor');
    const unsavedMark = within(row).getByRole('img', { name: UNSAVED_MARK });

    expect(row).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(row).toHaveTextContent(MOCK_VALUE);
    expect(row).toHaveTextContent('Customised');
    expect(unsavedMark).toBeVisible();
    expect(editor).toBeVisible();
  });
});
