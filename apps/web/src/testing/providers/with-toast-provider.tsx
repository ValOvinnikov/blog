import { ToastProvider } from '@web/context/toast-provider';
import type { ComponentType } from 'react';

export const withToastProvider = <TProps extends object>(
  Component: ComponentType<TProps>,
) => {
  const WithToastProvider = (props: TProps) => (
    <ToastProvider>
      <Component {...props} />
    </ToastProvider>
  );
  return WithToastProvider;
};
