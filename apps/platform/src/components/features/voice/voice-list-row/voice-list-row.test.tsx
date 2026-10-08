import { customRender, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { VoiceListRow } from './voice-list-row';

const setup = customRender(VoiceListRow, {
  label: 'Tag page',
  text: 'No posts tagged {name} yet.',
  isCustomised: false,
  isUnsaved: false,
  hasError: false,
  onOpen: vi.fn(),
});

describe(`<${VoiceListRow.name}/>`, () => {
  it('summarises the list as a collapsed button with its current text and status', () => {
    setup();

    const row = screen.getByRole('button', { name: /Tag page/ });
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(row).toHaveTextContent('No posts tagged {name} yet.');
    expect(row).toHaveTextContent('Default');
  });

  it('announces an unsaved customised value', () => {
    setup({ isCustomised: true, isUnsaved: true });

    expect(screen.getByRole('button', { name: /Tag page/ })).toHaveTextContent(
      'UnsavedCustomised',
    );
  });

  it('opens the list when pressed', async () => {
    const onOpen = vi.fn();
    setup({ onOpen });

    await userEvent.setup().click(screen.getByRole('button'));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
