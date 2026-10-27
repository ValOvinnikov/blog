import {
  isOutcomeSuccess,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { useLeadsTenantId } from '@platform/components/features/leads/leads-tenant-provider';
import { useToast } from '@platform/context/toast-provider';
import { setLeadReadAction } from '@platform/server/leads/set-lead-read-action';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';

type TUseLeadSelectionInput = {
  leads: TInboxLead[];
  updateLead: (id: string, change: Partial<TInboxLead>) => void;
  removeLead: (id: string) => void;
};

export const useLeadSelection = ({
  leads,
  updateLead,
  removeLead,
}: TUseLeadSelectionInput) => {
  const t = useTranslations('leadsInbox');
  const tenantId = useLeadsTenantId();
  const router = useRouter();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<TMaybeUndefined<string>>();
  const paneHeadingRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef(new Map<string, HTMLButtonElement>());

  const rowRef = (id: string) => (row: TMaybeNull<HTMLButtonElement>) => {
    if (row) rowsRef.current.set(id, row);
    return () => {
      rowsRef.current.delete(id);
    };
  };

  const showPane = (id: string) => {
    flushSync(() => setSelectedId(id));
    paneHeadingRef.current?.focus();
  };

  const close = () => {
    flushSync(() => setSelectedId(undefined));
    if (!isUndefined(selectedId)) rowsRef.current.get(selectedId)?.focus();
  };

  const setReadState = async (
    { id, isRead: wasRead }: TInboxLead,
    isRead: boolean,
  ) => {
    updateLead(id, { isRead });
    const result = await setLeadReadAction(tenantId, id, isRead);
    if (isOutcomeSuccess(result)) {
      router.refresh();
      return;
    }
    updateLead(id, { isRead: wasRead });
    toast.error({ message: t('readStateFailed') });
  };

  const open = (lead: TInboxLead) => {
    showPane(lead.id);
    if (!lead.isRead) void setReadState(lead, true);
  };

  const markUnread = (lead: TInboxLead) => {
    close();
    void setReadState(lead, false);
  };

  const handleDeleted = (id: string) => {
    const index = leads.findIndex((lead) => lead.id === id);
    const neighbour = leads[index + 1] ?? leads[index - 1];
    flushSync(() => {
      removeLead(id);
      setSelectedId(undefined);
    });
    const neighbourRow = neighbour && rowsRef.current.get(neighbour.id);
    (neighbourRow ?? listRef.current)?.focus();
    router.refresh();
  };

  return {
    selectedId,
    paneHeadingRef,
    listRef,
    rowRef,
    open,
    markUnread,
    close,
    handleDeleted,
  };
};
