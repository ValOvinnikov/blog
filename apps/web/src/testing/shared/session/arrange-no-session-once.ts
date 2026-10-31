import { mockedAuth } from './mocked-auth';

export const arrangeNoSessionOnce = (): void => {
  mockedAuth().mockResolvedValueOnce(null);
};
