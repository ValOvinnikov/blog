import { faker } from '@faker-js/faker';

import { workflowRunUrl, type TWorkflowRunUrlInput } from './workflow-run-url';

faker.seed(5802);

const MOCK_SERVER_URL = faker.internet.url({ appendSlash: false });
const MOCK_REPOSITORY = `${faker.internet.username()}/${faker.word.noun()}`;
const MOCK_RUN_ID = faker.string.numeric(10);

const MOCK_RUN_INPUT: TWorkflowRunUrlInput = {
  serverUrl: MOCK_SERVER_URL,
  repository: MOCK_REPOSITORY,
  runId: MOCK_RUN_ID,
};

describe(workflowRunUrl, () => {
  it('builds the absolute run URL when every part is present', () => {
    const result = workflowRunUrl(MOCK_RUN_INPUT);

    expect(result).toBe(
      `${MOCK_SERVER_URL}/${MOCK_REPOSITORY}/actions/runs/${MOCK_RUN_ID}`,
    );
  });

  it.each(['serverUrl', 'repository', 'runId'] as const)(
    'returns undefined when %s is missing',
    (missingPart) => {
      const result = workflowRunUrl({
        ...MOCK_RUN_INPUT,
        [missingPart]: undefined,
      });

      expect(result).toBeUndefined();
    },
  );
});
