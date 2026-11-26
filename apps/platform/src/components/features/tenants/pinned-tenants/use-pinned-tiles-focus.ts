import { usePinnedTenants } from '@platform/components/features/tenants/pinned-tenants-provider';
import { TENANTS_SEARCH_INPUT_ID } from '@platform/constants/tenant';
import type { TPinnedTenant } from '@platform/utils/pinned-tenants/pinned-tenants';
import type { TMaybeNull } from '@shinefold/config';
import { type RefObject, useLayoutEffect, useRef } from 'react';

type TPendingFocus = {
  removedId: string;
  index: number;
};

type TUsePinnedTilesFocusInput = {
  listRef: RefObject<TMaybeNull<HTMLUListElement>>;
  firstRow: number;
  isExpanded: boolean;
};

export const usePinnedTilesFocus = ({
  listRef,
  firstRow,
  isExpanded,
}: TUsePinnedTilesFocusInput) => {
  const { pinnedTenants, setPinned } = usePinnedTenants();
  const unpinButtons = useRef(new Map<string, HTMLButtonElement>());
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<TMaybeNull<TPendingFocus>>(null);

  const unpinButtonRef =
    (id: string) => (button: TMaybeNull<HTMLButtonElement>) => {
      if (button) unpinButtons.current.set(id, button);
      return () => {
        unpinButtons.current.delete(id);
      };
    };

  const unpin = (tenant: TPinnedTenant) => {
    if (unpinButtons.current.get(tenant.id) === document.activeElement) {
      pendingFocus.current = {
        removedId: tenant.id,
        index: pinnedTenants.findIndex(({ id }) => id === tenant.id),
      };
    }
    setPinned(tenant, false);
  };

  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || pinnedTenants.some(({ id }) => id === pending.removedId)) {
      return;
    }
    pendingFocus.current = null;

    const successor =
      pinnedTenants[pending.index] ?? pinnedTenants[pending.index - 1];
    const target = successor && unpinButtons.current.get(successor.id);
    (target ?? document.getElementById(TENANTS_SEARCH_INPUT_ID))?.focus();
  }, [pinnedTenants]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (isExpanded || !list) return;

    const hiddenTiles = Array.from(list.children).slice(firstRow);
    if (hiddenTiles.some((tile) => tile.contains(document.activeElement))) {
      toggleRef.current?.focus();
    }
  }, [listRef, isExpanded, firstRow, pinnedTenants]);

  return { unpin, unpinButtonRef, toggleRef };
};
