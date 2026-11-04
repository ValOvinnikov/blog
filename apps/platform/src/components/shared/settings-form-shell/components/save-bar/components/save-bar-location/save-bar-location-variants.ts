import { saveBarLinkClasses } from '@platform/components/shared/settings-form-shell/components/save-bar/save-bar-variants';
import { tv } from '@platform/utils/tv/tv';

export const saveBarLocationVariants = tv({
  slots: {
    root: ['whitespace-nowrap text-admin-muted'],
    link: [...saveBarLinkClasses, 'cursor-pointer font-semibold'],
  },
});
