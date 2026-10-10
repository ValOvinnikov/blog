import { VOICE_FIELDS } from '@blog/config';
import { Accordion } from '@platform/components/shared/accordion';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import type { ComponentProps } from 'react';

import { VoiceListRow } from './voice-list-row';

const tagEmpty = VOICE_FIELDS.find(({ id }) => id === 'tagEmpty')!;

const setup = (overrides: Partial<ComponentProps<typeof VoiceListRow>> = {}) =>
  renderWithIntl(
    <Accordion
      openValue={overrides.isOpen ? 'tagEmpty' : undefined}
      onOpenValueChange={vi.fn()}
    >
      <VoiceListRow
        field={tagEmpty}
        locale="EN"
        value={null}
        savedValue={null}
        hasError={false}
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
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(row).toHaveTextContent('Shown at /tags/…');
    expect(row).toHaveTextContent('Default');
  });

  it('summarises a customised value and announces that it is unsaved', () => {
    setup({ value: 'Nothing tagged {name}.' });

    const row = screen.getByRole('button', { name: /Tag page/ });
    expect(row).toHaveTextContent('Nothing tagged {name}.');
    expect(row).toHaveTextContent('UnsavedCustomised');
  });

  it('trades the summary for its editor when open', () => {
    setup({ isOpen: true });

    const row = screen.getByRole('button', { name: /Tag page/ });
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(row).not.toHaveTextContent('Default');
    expect(screen.getByText('Editor')).toBeVisible();
  });
});
