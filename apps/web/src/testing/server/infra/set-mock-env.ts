import { env } from '@web/utils/env/env';

export const setMockEnv = (values: Partial<typeof env>): void => {
  for (const key of Object.keys(env)) {
    delete (env as Record<string, unknown>)[key];
  }
  Object.assign(env, values);
};
