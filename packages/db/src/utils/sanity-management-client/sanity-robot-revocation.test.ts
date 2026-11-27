import { faker } from '@faker-js/faker';
import { HTTP_STATUS } from '@shinefold/config';
import {
  emptyResponse,
  nthFetchCall,
  textResponse,
  useFetchFake,
} from '@shinefold/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_ERROR_BODY,
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_ROBOT_ID,
  MOCK_SANITY_TOKEN,
  mockSanityProjectInput,
} from '@shinefold/db/testing/sanity-management-client/fixtures';

import {
  revokeSanityRobotToken,
  robotsInRevocationOrder,
  SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH,
} from './sanity-robot-revocation';

faker.seed(7494);

const MOCK_ORGANIZATION_TOKEN = faker.string.alphanumeric(24);
const MOCK_REVOKE_INPUT = mockSanityProjectInput({
  organizationToken: MOCK_ORGANIZATION_TOKEN,
  robotId: MOCK_SANITY_ROBOT_ID,
});

const MOCK_SCOPE_MISMATCH_BODY = JSON.stringify({
  type: SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH,
});
const MOCK_MANAGEMENT_ROBOT = {
  id: faker.string.alphanumeric(10),
  label: faker.company.name(),
};
const MOCK_ORGANIZATION_ROBOT = {
  id: faker.string.alphanumeric(10),
  label: faker.company.name(),
};
const MOCK_OTHER_ROBOT = {
  id: faker.string.alphanumeric(10),
  label: faker.lorem.words(2),
};

const fetchMock = useFetchFake();

function authorizationOfCall(index: number): string {
  return nthFetchCall(fetchMock, index).headers['Authorization'] ?? '';
}

describe(revokeSanityRobotToken, () => {
  it('revokes with the project token alone when Sanity accepts it', async () => {
    fetchMock.mockResolvedValue(emptyResponse(HTTP_STATUS.NO_CONTENT));

    await revokeSanityRobotToken(MOCK_REVOKE_INPUT);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(authorizationOfCall(0)).toContain(MOCK_SANITY_TOKEN);
  });

  it('retries with the organisation token on a scope mismatch', async () => {
    fetchMock
      .mockResolvedValueOnce(
        textResponse(MOCK_SCOPE_MISMATCH_BODY, HTTP_STATUS.FORBIDDEN),
      )
      .mockResolvedValueOnce(emptyResponse(HTTP_STATUS.NO_CONTENT));

    await expect(
      revokeSanityRobotToken(MOCK_REVOKE_INPUT),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(nthFetchCall(fetchMock, 1).url).toBe(MOCK_SANITY_EXPECTED_URL.robot);
    expect(authorizationOfCall(1)).toContain(MOCK_ORGANIZATION_TOKEN);
  });

  it('does not retry a scope mismatch body on a non-403 status', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SCOPE_MISMATCH_BODY, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    await expect(revokeSanityRobotToken(MOCK_REVOKE_INPUT)).rejects.toThrow(
      SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rethrows any other 403 without retrying', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.FORBIDDEN),
    );

    await expect(revokeSanityRobotToken(MOCK_REVOKE_INPUT)).rejects.toThrow(
      MOCK_SANITY_ERROR_BODY,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe(robotsInRevocationOrder, () => {
  it("puts the management robot last and drops the organisation token's robot", () => {
    expect(
      robotsInRevocationOrder(
        [MOCK_MANAGEMENT_ROBOT, MOCK_ORGANIZATION_ROBOT, MOCK_OTHER_ROBOT],
        {
          managementRobotId: MOCK_MANAGEMENT_ROBOT.id,
          organizationRobotId: MOCK_ORGANIZATION_ROBOT.id,
        },
      ),
    ).toEqual([MOCK_OTHER_ROBOT, MOCK_MANAGEMENT_ROBOT]);
  });
});
