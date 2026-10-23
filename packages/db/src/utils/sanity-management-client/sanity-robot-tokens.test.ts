import { HTTP_METHOD, HTTP_STATUS, SANITY_ROBOT_ROLE } from '@blog/config';
import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_MINTED_TOKEN,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_ROBOT_ID,
  mockSanityProjectInput,
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

const createInput = mockSanityProjectInput({
  label: SANITY_READ_TOKEN_LABEL,
  role: SANITY_ROBOT_ROLE.VIEWER,
});

const MOCK_SECOND_ROBOT_ID = 'robot2';

const fetchMock = useFetchFake();

describe(createSanityRobotToken, () => {
  it('POSTs the label and role membership and returns the minted token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: MOCK_SANITY_ROBOT_ID,
        token: MOCK_SANITY_MINTED_TOKEN,
      }),
    );

    const result = await createSanityRobotToken(createInput);

    const { url, body } = firstFetchCall(fetchMock);
    expect(result).toEqual({
      id: MOCK_SANITY_ROBOT_ID,
      token: MOCK_SANITY_MINTED_TOKEN,
    });
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.robots);
    expect(body).toEqual({
      label: createInput.label,
      memberships: [
        {
          resourceType: 'project',
          resourceId: MOCK_SANITY_PROJECT_ID,
          roleNames: [createInput.role],
        },
      ],
    });
  });

  it.each([
    {
      field: 'the key field when token is absent',
      response: { id: MOCK_SANITY_ROBOT_ID, key: 'sk-legacy' },
      expected: { id: MOCK_SANITY_ROBOT_ID, token: 'sk-legacy' },
    },
    {
      field: 'the tokenId field when id is absent',
      response: {
        tokenId: MOCK_SANITY_ROBOT_ID,
        token: MOCK_SANITY_MINTED_TOKEN,
      },
      expected: { id: MOCK_SANITY_ROBOT_ID, token: MOCK_SANITY_MINTED_TOKEN },
    },
  ])('falls back to $field', async ({ response, expected }) => {
    fetchMock.mockResolvedValue(jsonResponse(response));

    const result = await createSanityRobotToken(createInput);

    expect(result).toEqual(expected);
  });

  it.each([
    { fields: 'a token nor key field', response: { id: MOCK_SANITY_ROBOT_ID } },
    {
      fields: 'an id nor tokenId field',
      response: { token: MOCK_SANITY_MINTED_TOKEN },
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
      deleteSanityRobotToken(
        mockSanityProjectInput({ robotId: MOCK_SANITY_ROBOT_ID }),
      ),
    ).resolves.toBeUndefined();

    const { url, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.robot);
    expect(method).toBe(HTTP_METHOD.DELETE);
  });
});

describe(listSanityRobotTokens, () => {
  it('GETs the robots endpoint and normalizes id/label from a bare array', async () => {
    const robots = [
      { id: MOCK_SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL },
      { id: MOCK_SECOND_ROBOT_ID, label: SANITY_WRITE_TOKEN_LABEL },
    ];
    fetchMock.mockResolvedValue(jsonResponse(robots));

    const result = await listSanityRobotTokens(mockSanityProjectInput({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(robots);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.robots);
    expect(method).toBe(HTTP_METHOD.GET);
  });

  it.each([
    {
      title: 'unwraps a `data` envelope response',
      response: {
        data: [{ id: MOCK_SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
      },
      expected: [{ id: MOCK_SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
    },
    {
      title: 'falls back to the tokenId field when id is absent',
      response: [
        { tokenId: MOCK_SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL },
      ],
      expected: [{ id: MOCK_SANITY_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL }],
    },
    {
      title: 'drops entries with no resolvable id',
      response: [
        { label: SANITY_READ_TOKEN_LABEL },
        { id: MOCK_SECOND_ROBOT_ID, label: SANITY_WRITE_TOKEN_LABEL },
      ],
      expected: [{ id: MOCK_SECOND_ROBOT_ID, label: SANITY_WRITE_TOKEN_LABEL }],
    },
  ])('$title', async ({ response, expected }) => {
    fetchMock.mockResolvedValue(jsonResponse(response));

    const result = await listSanityRobotTokens(mockSanityProjectInput({}));

    expect(result).toEqual(expected);
  });
});
