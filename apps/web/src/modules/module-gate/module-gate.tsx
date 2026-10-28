import { isModuleEntitled } from '@web/server/settings-features/is-module-entitled/is-module-entitled';
import type { ReactNode } from 'react';

export interface IModuleGateProps {
  moduleType: string;
  children: ReactNode;
}

export const ModuleGate = async ({
  moduleType,
  children,
}: IModuleGateProps): Promise<ReactNode> =>
  (await isModuleEntitled(moduleType)) ? children : null;
