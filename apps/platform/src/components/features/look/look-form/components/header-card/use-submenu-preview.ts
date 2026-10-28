import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { useRef, type FocusEvent } from 'react';

type TSubmenuPreviewState = {
  isHovered: boolean;
  isFocused: boolean;
  hasChanged: boolean;
};

export const useSubmenuPreview = () => {
  const { setIsSubmenuPreviewOpen } = useLookForm();
  const state = useRef<TSubmenuPreviewState>({
    isHovered: false,
    isFocused: false,
    hasChanged: false,
  });

  const update = (patch: Partial<TSubmenuPreviewState>) => {
    const next = { ...state.current, ...patch };
    const hasLeft = !next.isHovered && !next.isFocused;
    // A touch tap fires pointerleave before the change, so only a leave clears a change.
    if (hasLeft && patch.hasChanged === undefined) {
      next.hasChanged = false;
    }
    state.current = next;
    setIsSubmenuPreviewOpen(!hasLeft || next.hasChanged);
  };

  const triggerProps = {
    onPointerEnter: () => update({ isHovered: true }),
    onPointerLeave: () => update({ isHovered: false }),
    onFocus: () => update({ isFocused: true }),
    onBlur: ({ currentTarget, relatedTarget }: FocusEvent<HTMLElement>) => {
      if (!currentTarget.contains(relatedTarget)) {
        update({ isFocused: false });
      }
    },
  };

  return { triggerProps, markChanged: () => update({ hasChanged: true }) };
};
