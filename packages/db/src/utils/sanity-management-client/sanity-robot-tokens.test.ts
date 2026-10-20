import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  SANITY_ACCESS_API_BASE,
  SANITY_TEST_PROJECT_ID,
  useFetchFake,
  withSanityProject,
} from '@blog/db/testing/sanity-fetch';

import {
  createSanityRobotToken,
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from './sanity-robot-tokens';
import {
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
} from './sanity-token-labels';

const ROBOTS_URL = `${SANITY_ACCESS_API_BASE}/access/project/${SANITY_TEST_PROJECT_ID}/robots`;
const ROBOT_ID = 'robot1';
const MINTED_TOKEN = 'sk-minted';
const createInput = withSanityProject({
  label: SANITY_READ_TOKEN_LABEL,
  role: 'viewer' as const,
});

const fetchMock = useFetchFake();

describe(createSanityRobotToken, () => {
  it('POSTs the label and role membership and returns the minted token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: ROBOT_ID, token: MINTED_TOKEN }),
    );

    const result = await createSanityRobotToken(createInput);

    const { url, body } = firstFetchCall(fetchMock);
    expect(result).toEqual({ id: ROBOT_ID, token: MINTED_TOKEN });
    expect(url).toBe(ROBOTS_URL);
    expect(body).toEqual({
      label: createInput.label,
      memberships: [
        {
          resourceType: 'project',
          resourceId: SANITY_TEST_PROJECT_ID,
          roleNames: [createInput.role],
        },
      ],
    });
  });

  it.each([
    {
      field: 'the key field when token is absent',
      response: { id: ROBOT_ID, key: 'sk-legacy' },
      expected: { id: ROBOT_ID, token: 'sk-legacy' },
    },
    {
      field: 'the tokenId field when id is absent',
      response: { tokenId: ROBOT_ID, token: MINTED_TOKEN },
      expected: { id: ROBOT_ID, token: MINTED_TOKEN },
    },
  ])('falls back to $field', async ({ response, expected }) => {
    fetchMock.mockResolvedValue(jsonResponse(response));

    const result = await createSanityRobotToken(createInput);

    expect(result).toEqual(expected);
  });

  it.each([
    { fields: 'a token nor key field', response: { id: ROBOT_ID } },
    { fields: 'an id nor tokenId field', response: { token: MINTED_TOKEN } },
  ])('throws when the response has neither $fields', async ({ response }) => {
    fetchMock.mockResolvedValue(jsonResponse(response));

    await expect(createSanityRobotToken(createInput)).rejects.toThrow(
      /returned no id\/token/,
    );
  });
});

describe(deleteSanityRobotToken, () => {
  it('DELETEs the robot by id and tolerates an empty response body', async () => {
    fetchMock.mockResolvedValue(emptyResponse(204));

    await expect(
      deleteSanityRobotToken(withSanityProject({ robotId: ROBOT_ID })),
    ).resolves.toBeUndefined();

    const { url, init } = firstFetchCall(fetchMock);
    expect(url).toBe(`${ROBOTS_URL}/${ROBOT_ID}`);
    expect(init.method).toBe('DELETE');
  });
});

describe(listSanityRobotTokens, () => {
  it('GETs the robots endpoint and normalizes id/label from a bare array', async () => {
    const robots = [
      { id: ROBOT_ID, label: SANITY_READ_TOKEN_LABEL },
      { id: 'robot2', label: SANITY_WRITE_TOKEN_LABEL },
    ];
    fetchMock.mockResolvedValue(jsonResponse(robots));

    const result = await listSanityRobotTokens(withSanityProject({}));

    const { url, init } = firstFetchCall(fetchMock);
    expect(result).toEqual(robots);
    expect(url).toBe(ROBOTS_URL);
    expect(init.method ?? 'GET').toBe('GET');
  });

  it.each([
    {
      title: 'unwraps a `data` envelope response',
      response: { data: [{ id: ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }] },
      expected: [{ id: ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
    },
    {
      title: 'falls back to the tokenId field when id is absent',
      response: [{ tokenId: ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
      expected: [{ id: ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
    },
    {
      title: 'drops entries with no resolvable id',
      response: [
        { label: SANITY_READ_TOKEN_LABEL },
        { id: 'robot2', label: SANITY_WRITE_TOKEN_LABEL },
      ],
      expected: [{ id: 'robot2', label: SANITY_WRITE_TOKEN_LABEL }],
    },
  ])('$title', async ({ response, expected }) => {
    fetchMock.mockResolvedValue(jsonResponse(response));

    const result = await listSanityRobotTokens(withSanityProject({}));

    expect(result).toEqual(expected);
  });
});
