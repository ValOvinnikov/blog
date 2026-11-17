import { supportEnv } from '@platform/utils/support-env/support-env';

export const mockedSupportEnv: Partial<
  Record<keyof typeof supportEnv, string>
> = supportEnv;
