import { env } from '@platform/utils/env/env';
import { workerSecretsEnv } from '@platform/utils/worker-secrets-env/worker-secrets-env';

export const mockedEnv: Partial<Record<keyof typeof env, string>> = env;

export const mockedWorkerSecretsEnv: Partial<
  Record<keyof typeof workerSecretsEnv, string>
> = workerSecretsEnv;
