import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_CONTENT_MODULE_ID } from '@web/testing/modules/content/fixtures';

import { ContentModuleView } from './content-module-view';

const setup = customRender(ContentModuleView, {
  id: MOCK_CONTENT_MODULE_ID,
  brandVariant: BRAND_VARIANT.PRIMARY,
  body: [],
  layout: undefined,
});

describe(`<${ContentModuleView.name}/>`, () => {
  it('leaves the section landmark without an accessible name', () => {
    setup();

    const section = screen.getByTestId(
      `content-module-${MOCK_CONTENT_MODULE_ID}`,
    );
    expect(section).not.toHaveAttribute('aria-labelledby');
  });
});
