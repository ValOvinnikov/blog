'use client';

import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';

import { portableTextEditorLinkControlVariants } from './portable-text-editor-link-control-variants';

export type TPortableTextEditorLinkControlProps = {
  id: string;
  initialHref: string;
  hasExistingLink: boolean;
  onApply: (href: string) => void;
  onRemove: () => void;
  onCancel: () => void;
};

/**
 * The small inline form the toolbar's Link button opens — applying an
 * annotation needs a URL from the operator, which a plain toggle button
 * can't collect on its own.
 */
export const PortableTextEditorLinkControl = ({
  id,
  initialHref,
  hasExistingLink,
  onApply,
  onRemove,
  onCancel,
}: TPortableTextEditorLinkControlProps) => {
  const t = useTranslations('portableTextEditorToolbar');
  const inputId = useId();
  const [href, setHref] = useState(initialHref);
  const { root, input } = portableTextEditorLinkControlVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (href.trim() === '') return;
    onApply(href.trim());
  };

  return (
    <form id={id} className={root()} onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        {t('linkUrlLabel')}
      </label>
      <input
        id={inputId}
        type="url"
        required={true}
        placeholder="https://…"
        value={href}
        onChange={(event) => setHref(event.target.value)}
        className={input()}
      />
      <Button type="submit" variant="secondary" size={SIZE.SM}>
        {t('linkApply')}
      </Button>
      {hasExistingLink && (
        <Button type="button" variant="ghost" size={SIZE.SM} onClick={onRemove}>
          {t('removeLink')}
        </Button>
      )}
      <Button type="button" variant="ghost" size={SIZE.SM} onClick={onCancel}>
        {t('linkCancel')}
      </Button>
    </form>
  );
};
