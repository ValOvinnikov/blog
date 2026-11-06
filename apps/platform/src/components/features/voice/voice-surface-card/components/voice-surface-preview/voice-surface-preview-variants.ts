import { VOICE_SURFACE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const voiceSurfacePreviewVariants = tv({
  slots: {
    column: [
      'lg:rounded-br-admin lg:border-l lg:border-admin-line-2 lg:bg-admin-bg lg:p-admin-card',
    ],
    content: [
      'flex flex-col gap-2.5 lg:sticky lg:top-[calc(var(--spacing-admin-topbar)+var(--admin-voice-bar-height,0px)+--spacing(4))] lg:max-h-[calc(100dvh-var(--spacing-admin-topbar)-var(--admin-voice-bar-height,0px)-(--spacing(4))-var(--spacing-admin-dock))] lg:overflow-y-auto lg:overscroll-contain',
    ],
    toggle: ['w-full md:h-11 lg:hidden'],
    preview: [
      'flex flex-col gap-2.5',
      'max-lg:rounded-admin max-lg:border max-lg:border-admin-line-2 max-lg:bg-admin-bg max-lg:p-3.5',
    ],
    label: [
      'font-admin-mono text-admin-11 leading-admin-15 font-medium tracking-admin-caps text-admin-muted uppercase',
    ],
    specimen: ['grid'],
  },
  variants: {
    isArchive: {
      true: {
        column: [
          'max-lg:px-admin-card max-lg:pt-1.5 max-lg:pb-admin-card',
          'max-md:px-3.5 max-md:pb-2.5',
        ],
        specimen: ['min-h-[260px]'],
      },
      false: {
        column: ['max-lg:hidden'],
      },
    },
    surface: {
      [VOICE_SURFACE.NOT_FOUND]: { specimen: ['min-h-[300px]'] },
      [VOICE_SURFACE.ERROR]: { specimen: ['min-h-[240px]'] },
      [VOICE_SURFACE.BOOKMARKS]: { specimen: ['min-h-[150px]'] },
      [VOICE_SURFACE.ARCHIVE]: {},
    },
    isPreviewOpen: {
      false: { preview: ['max-lg:hidden'] },
    },
  },
});
