'use client';

import { Field } from '@base-ui/react/field';
import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';

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
  const [href, setHref] = useState(initialHref);
  const { root, input } = portableTextEditorLinkControlVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (href.trim() === '') return;
    onApply(href.trim());
  };

  return (
    <form id={id} className={root()} onSubmit={handleSubmit}>
      <Field.Root className="contents">
        <Field.Label className="sr-only">{t('linkUrlLabel')}</Field.Label>
        <Field.Control
          type="url"
          required={true}
          placeholder="https://…"
          value={href}
          onValueChange={(nextHref) => setHref(nextHref)}
          className={input()}
        />
      </Field.Root>
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
