import { tv } from 'tailwind-variants';

export const languageCodesVariants = tv({
  slots: {
    list: ['flex items-center'],
    item: [],
    link: ['font-mono'],
  },
  variants: {
    isInFooter: {
      false: {
        list: ['gap-0.5 rounded-full border border-border-strong p-0.5'],
        link: ['rounded-full px-2 py-0.5 text-label'],
      },
      true: {
        list: ['gap-2'],
        item: ["[&+&]:before:mr-2 [&+&]:before:content-['·']"],
        link: ['text-meta'],
      },
    },
  },
});
