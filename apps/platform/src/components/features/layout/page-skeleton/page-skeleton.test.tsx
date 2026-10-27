import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';

import { PageSkeleton } from './page-skeleton';

const SKELETON_TEST_ID = 'skeleton';

const setup = customRender(PageSkeleton, {});

describe(`<${PageSkeleton.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('announces one loading status', () => {
    const status = screen.getByRole('status');

    expect(status).toHaveTextContent(messages.pageSkeleton.label);
  });

  it('hides every placeholder shape from assistive technology', () => {
    const shapes = screen.getAllByTestId(SKELETON_TEST_ID);

    for (const shape of shapes) {
      expect(shape).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
