import { tv } from '@platform/utils/tv/tv';

export const signInAppReadOnlyCardVariants = tv({
  slots: {
    body: ['flex flex-col gap-5'],
    fields: ['grid grid-cols-1 gap-4 md:grid-cols-2'],
  },
});
