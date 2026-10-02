import { customRenderAsync } from '@web/testing/custom-render';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { TopicIndexBreadcrumbs } from './topic-index-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

const setup = customRenderAsync(TopicIndexBreadcrumbs, {});

describe(`<${TopicIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {});

  testStaticBreadcrumbsContract({
    setup,
    label: 'Topics',
    path: '/topics',
  });
});
