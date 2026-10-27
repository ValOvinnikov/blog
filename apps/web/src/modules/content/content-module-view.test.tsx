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
  it('exposes no region landmark because the module renders no heading', () => {
    setup();

    const region = screen.queryByRole('region');

    expect(region).not.toBeInTheDocument();
  });
});
