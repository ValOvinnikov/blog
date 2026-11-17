import { webSecretsEnv } from '@platform/utils/web-secrets-env/web-secrets-env';

export const mockedWebSecretsEnv: Partial<
  Record<keyof typeof webSecretsEnv, string>
> = webSecretsEnv;
