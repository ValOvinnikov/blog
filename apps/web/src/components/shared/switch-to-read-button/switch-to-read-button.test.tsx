import { DEPTH } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import { DepthProvider } from '@web/context/depth-provider';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';

import { SwitchToReadButton } from './switch-to-read-button';

describe(`<${SwitchToReadButton.name}/>`, () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.SKIM);
  });

  it('switches the reading depth back to READ on click', async () => {
    const user = userEvent.setup();
    renderElement(
      <DepthProvider hasSkim={true} hasDeep={false}>
        <SwitchToReadButton label="Read the full article" />
      </DepthProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Read the full article' }),
    );

    await waitFor(() =>
      expect(localStorage.getItem(DEPTH_STORAGE_KEY)).toBe(DEPTH.READ),
    );
  });
});
