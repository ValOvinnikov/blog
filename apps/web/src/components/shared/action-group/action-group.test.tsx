import { CTA_ACTION_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
} from '@web/testing/modules/cta/fixtures';

import { ActionGroup } from './action-group';

faker.seed(5701);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_SUFFIX = faker.lorem.words(3);

const MOCK_ACTION_WITH_SUFFIX = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: undefined,
  link: { ...MOCK_CTA_PRIMARY_ACTION.link, label: MOCK_LABEL },
  hiddenLabelSuffix: MOCK_SUFFIX,
};

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
      const [firstLink, secondLink, ...otherLinks] =
        screen.getAllByRole('link');

      expect(firstLink).toHaveTextContent(MOCK_CTA_PRIMARY_ACTION.link.label);
      expect(secondLink).toHaveTextContent(
        MOCK_CTA_SECONDARY_ACTION.link.label,
      );
      expect(otherLinks).toHaveLength(0);
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
    it('includes the suffix in the link accessible name', () => {
      setup({ actions: [MOCK_ACTION_WITH_SUFFIX] });

      const link = screen.getByRole('link', {
        name: `${MOCK_LABEL}: ${MOCK_SUFFIX}`,
      });

      expect(link).toBeVisible();
    });

    it('names the link by its label when hiddenLabelSuffix is unset', () => {
      setup({
        actions: [{ ...MOCK_ACTION_WITH_SUFFIX, hiddenLabelSuffix: undefined }],
      });

      const link = screen.getByRole('link', { name: MOCK_LABEL });

      expect(link).toBeVisible();
    });
  });
});
