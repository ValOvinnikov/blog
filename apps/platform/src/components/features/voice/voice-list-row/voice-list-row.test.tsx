import { VOICE_FIELDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { Accordion } from '@platform/components/shared/accordion';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
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

    const row = screen.getByRole('button', { name: /Tag page/ });

    expect(row).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(row).toHaveTextContent('Shown at /tags/…');
    expect(row).toHaveTextContent('Default');
  });

  it('summarises a customised value and announces that it is unsaved', () => {
    setup({ value: MOCK_VALUE });

    const row = screen.getByRole('button', { name: /Tag page/ });

    expect(row).toHaveTextContent(MOCK_VALUE);
    expect(row).toHaveTextContent('UnsavedCustomised');
  });

  it('describes a closed list with its error in text', () => {
    setup({ error: MOCK_ERROR });

    const row = screen.getByRole('button', { name: /Tag page/ });
    const errorText = screen.getByText(MOCK_ERROR);

    expect(row).toHaveAccessibleDescription(MOCK_ERROR);
    expect(errorText).toBeVisible();
  });

  it('leaves the error to the open editor', () => {
    setup({ isOpen: true, error: MOCK_ERROR });

    const row = screen.getByRole('button', { name: /Tag page/ });
    const errorText = screen.queryByText(MOCK_ERROR);

    expect(row).not.toHaveAccessibleDescription();
    expect(errorText).not.toBeInTheDocument();
  });

  it('trades the summary for its editor when open', () => {
    setup({ isOpen: true });

    const row = screen.getByRole('button', { name: /Tag page/ });
    const editor = screen.getByText('Editor');

    expect(row).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(row).not.toHaveTextContent('Default');
    expect(editor).toBeVisible();
  });
});
