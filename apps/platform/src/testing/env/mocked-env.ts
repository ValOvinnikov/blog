import { env } from '@platform/utils/env/env';

export const mockedEnv: Partial<Record<keyof typeof env, string>> = env;
