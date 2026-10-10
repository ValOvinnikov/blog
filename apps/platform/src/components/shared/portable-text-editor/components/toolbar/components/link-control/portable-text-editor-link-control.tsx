'use client';

import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
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
  const { root, input, error } = portableTextEditorLinkControlVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (href.trim() === '') return;
    onApply(href.trim());
  };

  return (
    <Form id={id} className={root()} onSubmit={handleSubmit}>
      <Field.Root className="contents">
        <Field.Label className="sr-only">{t('linkUrlLabel')}</Field.Label>
        <Field.Control
          type="url"
          required={true}
          placeholder={t('linkUrlPlaceholder')}
          value={href}
          onValueChange={(nextHref) => setHref(nextHref)}
          className={input()}
        />
        <Field.Error className={error()} />
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
    </Form>
  );
};
