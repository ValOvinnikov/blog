import { DEPTH } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import { DepthProvider } from '@web/context/depth-provider';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';

import { SwitchToReadButton } from './switch-to-read-button';

const READ_FULL_ARTICLE_LABEL = 'Read the full article';

describe(`<${SwitchToReadButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    localStorage.clear();
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.SKIM);
    renderElement(
      <DepthProvider hasSkim={true} hasDeep={false}>
        <SwitchToReadButton label={READ_FULL_ARTICLE_LABEL} />
      </DepthProvider>,
    );
  });

  it('switches the reading depth back to READ on click', async () => {
    const readButton = screen.getByRole('button', {
      name: READ_FULL_ARTICLE_LABEL,
    });

    await user.click(readButton);

    await waitFor(() => {
      expect(localStorage.getItem(DEPTH_STORAGE_KEY)).toBe(DEPTH.READ);
    });
  });
});
