export const MOCK_QUERY_ERROR_NAME = 'DrizzleQueryError';
export const MOCK_POSTGRES_ERROR_CODE = '57P01';

export const mockQueryError = (...leaks: string[]): Error => {
  const leak = leaks.join(' ');
  const error = new Error(`Failed query: select … params: ${leak}`, {
    cause: Object.assign(new Error(`terminating connection: ${leak}`), {
      code: MOCK_POSTGRES_ERROR_CODE,
      detail: leak,
    }),
  });
  error.name = MOCK_QUERY_ERROR_NAME;
  return error;
};
