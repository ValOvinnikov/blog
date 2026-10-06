import { customRenderAsync } from '@web/testing/custom-render';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { PostIndexBreadcrumbs } from './post-index-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

const setup = customRenderAsync(PostIndexBreadcrumbs, {});

describe(`<${PostIndexBreadcrumbs.name}/>`, () => {
  testStaticBreadcrumbsContract({
    setup,
    label: 'Blog',
    path: '/blog',
  });
});
