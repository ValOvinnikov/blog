import {
  MOCK_TENANT_DATASET,
  MOCK_TENANT_PROJECT_ID,
} from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getSanityImageBaseUrl } from './image-base-url';

faker.seed(6016);

const MOCK_OTHER_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_OTHER_DATASET = faker.lorem.word();

describe(getSanityImageBaseUrl, () => {
  it.each([
    { projectId: MOCK_TENANT_PROJECT_ID, dataset: MOCK_TENANT_DATASET },
    { projectId: MOCK_OTHER_PROJECT_ID, dataset: MOCK_OTHER_DATASET },
  ])(
    'builds the CDN base URL for project $projectId/$dataset',
    ({ projectId, dataset }) => {
      const baseUrl = getSanityImageBaseUrl({ projectId, dataset });

      expect(baseUrl).toBe(
        `https://cdn.sanity.io/images/${projectId}/${dataset}/`,
      );
    },
  );
});
