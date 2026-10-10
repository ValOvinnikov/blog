import { tv } from '@platform/utils/tv/tv';

export const voiceSpecimenVariants = tv({
  slots: {
    root: ['shadow-card'],
    page: ['flex flex-col items-center gap-5 py-6 text-center'],
    copy: ['max-w-copy mx-auto'],
    actions: ['flex flex-wrap items-center justify-center gap-3'],
    listPage: ['flex flex-col gap-3'],
    emptyMessage: ['text-copy text-muted'],
    bookmarksPage: ['flex flex-col gap-4'],
  },
});
