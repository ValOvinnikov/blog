import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_ACTIONS,
  MOCK_CTA_PRIMARY_ACTION,
} from '@web/testing/modules/cta/fixtures';

import { ModuleActions } from './module-actions';

vi.mock('@web/i18n/navigation');

const setup = customRender(ModuleActions, {
  actions: MOCK_CTA_ACTIONS,
  align: undefined,
});

describe(`<${ModuleActions.name}/>`, () => {
  it('renders each action as a link', () => {
    setup();

    const action = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });

    expect(action).toHaveAttribute('href', MOCK_CTA_PRIMARY_ACTION.link.href);
  });

  it('renders nothing when there are no actions', () => {
    const { container } = setup({ actions: [] });

    expect(container).toBeEmptyDOMElement();
  });
});
