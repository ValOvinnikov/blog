import {
  HTTP_METHOD,
  HTTP_STATUS,
  SANITY_RESOURCE_TYPE,
  SANITY_ROBOT_ROLE,
} from '@blog/config';
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
import { faker } from '@faker-js/faker';

import {
  createSanityRobotToken,
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from './sanity-robot-tokens';

faker.seed(1903);

const MOCK_READ_LABEL = faker.lorem.words(2);
const MOCK_WRITE_LABEL = faker.lorem.words(2);
const MOCK_LEGACY_TOKEN = faker.string.alphanumeric(16);
const MOCK_CREATE_INPUT = mockSanityProjectInput({
  label: MOCK_READ_LABEL,
  role: SANITY_ROBOT_ROLE.VIEWER,
});

const MOCK_SECOND_ROBOT_ID = faker.string.alphanumeric(10);

const fetchMock = useFetchFake();

describe(createSanityRobotToken, () => {
  it('POSTs the label and role membership and returns the minted token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: MOCK_SANITY_ROBOT_ID,
        token: MOCK_SANITY_MINTED_TOKEN,
      }),
    );

    const result = await createSanityRobotToken(MOCK_CREATE_INPUT);

    const { url, body } = firstFetchCall(fetchMock);
    expect(result).toEqual({
      id: MOCK_SANITY_ROBOT_ID,
      token: MOCK_SANITY_MINTED_TOKEN,
    });
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.robots);
    expect(body).toEqual({
      label: MOCK_CREATE_INPUT.label,
      memberships: [
        {
          resourceType: SANITY_RESOURCE_TYPE.PROJECT,
          resourceId: MOCK_SANITY_PROJECT_ID,
          roleNames: [MOCK_CREATE_INPUT.role],
        },
      ],
    });
  });

  it.each([
    {
      field: 'the key field when token is absent',
      response: { id: MOCK_SANITY_ROBOT_ID, key: MOCK_LEGACY_TOKEN },
      expected: { id: MOCK_SANITY_ROBOT_ID, token: MOCK_LEGACY_TOKEN },
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

    const result = await createSanityRobotToken(MOCK_CREATE_INPUT);

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

    await expect(createSanityRobotToken(MOCK_CREATE_INPUT)).rejects.toThrow(
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
      { id: MOCK_SANITY_ROBOT_ID, label: MOCK_READ_LABEL },
      { id: MOCK_SECOND_ROBOT_ID, label: MOCK_WRITE_LABEL },
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
        data: [{ id: MOCK_SANITY_ROBOT_ID, label: MOCK_READ_LABEL }],
      },
      expected: [{ id: MOCK_SANITY_ROBOT_ID, label: MOCK_READ_LABEL }],
    },
    {
      title: 'falls back to the tokenId field when id is absent',
      response: [{ tokenId: MOCK_SANITY_ROBOT_ID, label: MOCK_READ_LABEL }],
      expected: [{ id: MOCK_SANITY_ROBOT_ID, label: MOCK_READ_LABEL }],
    },
    {
      title: 'drops entries with no resolvable id',
      response: [
        { label: MOCK_READ_LABEL },
        { id: MOCK_SECOND_ROBOT_ID, label: MOCK_WRITE_LABEL },
      ],
      expected: [{ id: MOCK_SECOND_ROBOT_ID, label: MOCK_WRITE_LABEL }],
    },
  ])('$title', async ({ response, expected }) => {
    fetchMock.mockResolvedValue(jsonResponse(response));

    const result = await listSanityRobotTokens(mockSanityProjectInput({}));

    expect(result).toEqual(expected);
  });
});
