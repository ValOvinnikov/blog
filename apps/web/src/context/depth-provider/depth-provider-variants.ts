import { tv } from 'tailwind-variants';

export const depthProviderVariants = tv({
  slots: {
    // Named group (`/depth`) so descendants can gate their own visibility
    // off this element's `data-depth` via `group-data-[depth=…]/depth:…`
    // without colliding with an unrelated `group` elsewhere in the tree.
    root: ['group/depth'],
  },
});
