import { CTA_ACTION_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
} from '@web/testing/modules/cta/fixtures';

import { ActionGroup } from './action-group';

const setup = customRender(ActionGroup, {
  actions: [MOCK_CTA_PRIMARY_ACTION, MOCK_CTA_SECONDARY_ACTION],
  isOnDark: undefined,
});

describe(`<${ActionGroup.name}/>`, () => {
  describe('with authored actions', () => {
    beforeEach(() => {
      setup();
    });

    it('renders every action in authored order', () => {
      const links = screen.getAllByRole('link');

      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent(MOCK_CTA_PRIMARY_ACTION.link.label);
      expect(links[1]).toHaveTextContent(MOCK_CTA_SECONDARY_ACTION.link.label);
    });

    it('forwards the authored ariaLabel as the link accessible name', () => {
      const link = screen.getByRole('link', {
        name: MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
      });

      expect(link).toBeVisible();
    });

    it('falls back to the label as the accessible name without an ariaLabel', () => {
      const link = screen.getByRole('link', {
        name: MOCK_CTA_PRIMARY_ACTION.link.label,
      });

      expect(link).toBeVisible();
    });
  });

  describe('with a hiddenLabelSuffix', () => {
    const LABEL = 'Read more';
    const SUFFIX = 'Welcome to the blog';
    const actionWithSuffix = {
      variant: CTA_ACTION_VARIANT.PRIMARY,
      appearance: undefined,
      link: { ...MOCK_CTA_PRIMARY_ACTION.link, label: LABEL },
      hiddenLabelSuffix: SUFFIX,
    };

    const setupWithSuffix = customRender(ActionGroup, {
      actions: [actionWithSuffix],
      isOnDark: undefined,
    });

    it('renders the suffix as real text inside the accessible name', () => {
      setupWithSuffix();

      const link = screen.getByRole('link', { name: `${LABEL}: ${SUFFIX}` });

      expect(link).toBeVisible();
      expect(link).toHaveTextContent(`${LABEL}: ${SUFFIX}`);
    });

    it('renders no suffix when hiddenLabelSuffix is unset', () => {
      setupWithSuffix({
        actions: [{ ...actionWithSuffix, hiddenLabelSuffix: undefined }],
      });

      const link = screen.getByRole('link', { name: LABEL });

      expect(link).toBeVisible();
      expect(link).toHaveTextContent(LABEL);
    });
  });
});
