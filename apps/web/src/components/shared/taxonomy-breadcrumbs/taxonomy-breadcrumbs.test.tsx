import { faker } from '@faker-js/faker';
import { routes } from '@shinefold/config';
import { customRenderServerAsync } from '@web/testing/custom-render';
import {
  testBreadcrumbsJsonLdSchema,
  testNoJsonLdWithoutBaseUrl,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';

import { TaxonomyBreadcrumbs } from './taxonomy-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds');

vi.mock('@web/i18n/navigation');

faker.seed(2894);

const TERM_HREF = routes.tag(faker.lorem.slug());

const setup = customRenderServerAsync(TaxonomyBreadcrumbs, {
  term: { label: faker.lorem.words(2), href: TERM_HREF },
});

describe(`<${TaxonomyBreadcrumbs.name}/>`, () => {
  testBreadcrumbsJsonLdSchema({ setup, itemPath: TERM_HREF });
  testNoJsonLdWithoutBaseUrl({ setup });
});
