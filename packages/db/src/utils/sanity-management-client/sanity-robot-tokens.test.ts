import { HTTP_METHOD, HTTP_STATUS, SANITY_ROBOT_ROLE } from '@blog/config';
import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  SANITY_EXPECTED_URL,
  SANITY_MINTED_TOKEN,
  SANITY_PROJECT_ID,
  SANITY_ROBOT_ID,
  withSanityProject,
} from '@blog/db/testing/sanity-management-client/fixtures';

import {
  createSanityRobotToken,
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from './sanity-robot-tokens';
import {
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
} from './sanity-token-labels';

const createInput = withSanityProject({
  label: SANITY_READ_TOKEN_LABEL,
  role: SANITY_ROBOT_ROLE.VIEWER,
});

const fetchMock = useFetchFake();

describe(createSanityRobotToken, () => {
  it('POSTs the label and role membership and returns the minted token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: SANITY_ROBOT_ID, token: SANITY_MINTED_TOKEN }),
    );

    const result = await createSanityRobotToken(createInput);

    const { url, body } = firstFetchCall(fetchMock);
    expect(result).toEqual({ id: SANITY_ROBOT_ID, token: SANITY_MINTED_TOKEN });
    expect(url).toBe(SANITY_EXPECTED_URL.robots);
    expect(body).toEqual({
      label: createInput.label,
      memberships: [
        {
          resourceType: 'project',
          resourceId: SANITY_PROJECT_ID,
          roleNames: [createInput.role],
        },
      ],
    });
  });

  it.each([
    {
      field: 'the key field when token is absent',
      response: { id: SANITY_ROBOT_ID, key: 'sk-legacy' },
      expected: { id: SANITY_ROBOT_ID, token: 'sk-legacy' },
    },
    {
      field: 'the tokenId field when id is absent',
      response: { tokenId: SANITY_ROBOT_ID, token: SANITY_MINTED_TOKEN },
      expected: { id: SANITY_ROBOT_ID, token: SANITY_MINTED_TOKEN },
    },
  ])('falls back to $field', async ({ response, expected }) => {
    fetchMock.mockResolvedValue(jsonResponse(response));

    const result = await createSanityRobotToken(createInput);

    expect(result).toEqual(expected);
  });

  it.each([
    { fields: 'a token nor key field', response: { id: SANITY_ROBOT_ID } },
    {
      fields: 'an id nor tokenId field',
      response: { token: SANITY_MINTED_TOKEN },
    },
  ])('throws when the response has neither $fields', async ({ response }) => {
    fetchMock.mockResolvedValue(jsonResponse(response));

    await expect(createSanityRobotToken(createInput)).rejects.toThrow(
      /returned no id\/token/,
    );
  });
});

describe(deleteSanityRobotToken, () => {
  it('DELETEs the robot by id and tolerates an empty response body', async () => {
    fetchMock.mockResolvedValue(emptyResponse(HTTP_STATUS.NO_CONTENT));

    await expect(
      deleteSanityRobotToken(withSanityProject({ robotId: SANITY_ROBOT_ID })),
    ).resolves.toBeUndefined();

    const { url, method } = firstFetchCall(fetchMock);
    expect(url).toBe(SANITY_EXPECTED_URL.robot);
    expect(method).toBe(HTTP_METHOD.DELETE);
  });
});

describe(listSanityRobotTokens, () => {
  it('GETs the robots endpoint and normalizes id/label from a bare array', async () => {
    const robots = [
      { id: SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL },
      { id: 'robot2', label: SANITY_WRITE_TOKEN_LABEL },
    ];
    fetchMock.mockResolvedValue(jsonResponse(robots));

    const result = await listSanityRobotTokens(withSanityProject({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(robots);
    expect(url).toBe(SANITY_EXPECTED_URL.robots);
    expect(method).toBe(HTTP_METHOD.GET);
  });

  it.each([
    {
      title: 'unwraps a `data` envelope response',
      response: {
        data: [{ id: SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
      },
      expected: [{ id: SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
    },
    {
      title: 'falls back to the tokenId field when id is absent',
      response: [{ tokenId: SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
      expected: [{ id: SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
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
