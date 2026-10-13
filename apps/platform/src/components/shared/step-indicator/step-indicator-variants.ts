import { tv } from '@platform/utils/tv/tv';

export const stepIndicatorVariants = tv({
  slots: {
    root: ['flex flex-none flex-col items-center self-stretch'],
    circle: [
      'flex h-6 w-6 flex-none items-center justify-center',
      'rounded-full text-admin-12-5 font-bold',
    ],
    connector: ['my-1 w-0.5 flex-1 bg-admin-line-2'],
  },
  variants: {
    state: {
      DONE: { circle: ['bg-admin-ok text-white'] },
      FAILED: { circle: ['bg-admin-bad text-white'] },
      RUNNING: { circle: ['bg-admin-warn text-white'] },
      ACTIVE: { circle: ['bg-admin-brand text-white'] },
      UPCOMING: { circle: ['bg-admin-line-2 text-admin-muted'] },
    },
    isConnectorDone: {
      true: { connector: ['bg-admin-ok'] },
      false: {},
    },
  },
  defaultVariants: {
    isConnectorDone: false,
  },
});
