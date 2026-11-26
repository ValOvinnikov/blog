import { routes } from '@shinefold/config';
import type { TValueOf } from '@shinefold/config/utils';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { TErrorPageProps } from '@web/components/shared/error-page-layout';
import type { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { customRender, screen } from '@web/testing/custom-render';
import { ARIA_LIVE_ASSERTIVE_SELECTOR } from '@web/testing/shared/aria/constants';
import {
  MOCK_ERROR_DIGEST,
  MOCK_ERROR_WITH_DIGEST,
} from '@web/testing/shared/error/fixtures';
import { reportClientError } from '@web/utils/report-client-error';
import type { ComponentType } from 'react';

interface IErrorPageContractOptions {
  Page: ComponentType<TErrorPageProps>;
  logEvent: TValueOf<typeof ERROR_BOUNDARY_LOG>;
  copy: {
    title: string;
    tryAgain: string;
    goHome: string;
    announcement: string;
  };
}

export const testErrorPageContract = ({
  Page,
  logEvent,
  copy: { title, tryAgain, goHome, announcement },
}: IErrorPageContractOptions) => {
  const reset = vi.fn();
  const setup = customRender(Page, { error: MOCK_ERROR_WITH_DIGEST, reset });

  describe('when rendered', () => {
    let rerender: ReturnType<typeof setup>['rerender'];
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      ({ rerender } = setup());
    });

    it('renders the heading', () => {
      const heading = screen.getByRole('heading', { level: 1, name: title });

      expect(heading).toBeVisible();
    });

    describe('its actions', () => {
      let tryAgainButton: HTMLElement;
      let goHomeLink: HTMLElement;

      beforeEach(() => {
        tryAgainButton = screen.getByRole('button', { name: tryAgain });
        goHomeLink = screen.getByRole('link', { name: goHome });
      });

      it('renders a try-again button', () => {
        expect(tryAgainButton).toBeVisible();
      });

      it('calls reset when "Try again" is clicked', async () => {
        await user.click(tryAgainButton);

        expect(reset).toHaveBeenCalledTimes(1);
      });

      it('renders "Go home" as a real link, not a button', () => {
        expect(goHomeLink).toBeVisible();
        expect(goHomeLink).toHaveAttribute('href', routes.home());
      });

      it('names both actions in the announcement as the controls render them', () => {
        const lowerAnnouncement = announcement.toLowerCase();

        expect(lowerAnnouncement).toContain(
          (tryAgainButton.textContent ?? '').toLowerCase(),
        );
        expect(lowerAnnouncement).toContain(
          (goHomeLink.textContent ?? '').toLowerCase(),
        );
      });
    });

    describe('its live region', () => {
      let liveRegion: HTMLElement;

      beforeEach(() => {
        liveRegion = screen.getByText(announcement, {
          selector: ARIA_LIVE_ASSERTIVE_SELECTOR,
        });
      });

      it('announces the error to assistive technology after mount', () => {
        expect(liveRegion).toBeVisible();
      });

      it('sets aria-atomic on the live region', () => {
        expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('reports the error exactly once on mount, with its digest', () => {
      expect(vi.mocked(reportClientError)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(reportClientError)).toHaveBeenCalledWith(
        logEvent,
        MOCK_ERROR_WITH_DIGEST,
        { digest: MOCK_ERROR_DIGEST },
      );
    });

    it('does not re-report when re-rendered with the same error', () => {
      rerender(<Page error={MOCK_ERROR_WITH_DIGEST} reset={reset} />);

      expect(vi.mocked(reportClientError)).toHaveBeenCalledTimes(1);
    });

    it('moves focus to the page container on mount', () => {
      const main = screen.getByRole('main');

      expect(main).toHaveFocus();
    });
  });
};
