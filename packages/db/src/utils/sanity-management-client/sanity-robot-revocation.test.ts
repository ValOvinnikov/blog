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
  SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH,
} from './sanity-robot-revocation';

faker.seed(7494);

const MOCK_ORGANISATION_TOKEN = faker.string.alphanumeric(24);
const MOCK_REVOKE_INPUT = mockSanityProjectInput({
  organisationToken: MOCK_ORGANISATION_TOKEN,
  robotId: MOCK_SANITY_ROBOT_ID,
});

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
        textResponse(
          JSON.stringify({ type: SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH }),
          HTTP_STATUS.FORBIDDEN,
        ),
      )
      .mockResolvedValueOnce(emptyResponse(HTTP_STATUS.NO_CONTENT));

    await expect(
      revokeSanityRobotToken(MOCK_REVOKE_INPUT),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(nthFetchCall(fetchMock, 1).url).toBe(MOCK_SANITY_EXPECTED_URL.robot);
    expect(authorizationOfCall(1)).toContain(MOCK_ORGANISATION_TOKEN);
  });

  it('rethrows any other failure without retrying', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.FORBIDDEN),
    );

    await expect(revokeSanityRobotToken(MOCK_REVOKE_INPUT)).rejects.toThrow(
      MOCK_SANITY_ERROR_BODY,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
