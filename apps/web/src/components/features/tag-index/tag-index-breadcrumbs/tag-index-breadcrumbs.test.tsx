import { customRenderAsync } from '@web/testing/custom-render';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { TagIndexBreadcrumbs } from './tag-index-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

const setup = customRenderAsync(TagIndexBreadcrumbs, {});

describe(`<${TagIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {});

  testStaticBreadcrumbsContract({
    setup,
    label: 'Tags',
    path: '/tags',
  });
});
