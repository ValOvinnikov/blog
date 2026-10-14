import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { findPublishedPageAtPath } from '@blog/studio/schema-types/queries/published-page-at-path/published-page-at-path';
import { Card, Stack, Text } from '@sanity/ui';
import { useEffect, useState } from 'react';
import { type ObjectInputProps, useClient } from 'sanity';

const NOTICE_CLIENT_API_VERSION = '2024-01-01';

const usePublishedPageTitle = (
  destination: unknown,
  language: unknown,
): string | null => {
  const client = useClient({ apiVersion: NOTICE_CLIENT_API_VERSION });
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    if (typeof destination !== 'string' || typeof language !== 'string') {
      return;
    }

    let isCurrent = true;

    findPublishedPageAtPath(
      client.withConfig({ perspective: 'published' }),
      destination,
      language,
    )
      .then((page) => {
        if (isCurrent) setTitle(page?.title ?? null);
      })
      .catch(() => {
        if (isCurrent) setTitle(null);
      });

    return () => {
      isCurrent = false;
    };
  }, [client, destination, language]);

  return title;
};

export const AutomaticRedirectNoticeInput = (props: ObjectInputProps) => {
  const { value } = props;
  const isAutomatic = value?.isAutomatic === true;
  const title = usePublishedPageTitle(
    isAutomatic ? value?.destination : undefined,
    value?.[LANGUAGE_FIELD],
  );

  if (!isAutomatic) return props.renderDefault(props);

  const page = title ? `“${title}”` : 'a page';

  return (
    <Stack gap={4}>
      <Card tone="caution" padding={3} radius={2} border={true}>
        <Text size={1}>
          Created automatically when {page} moved. Changing Source or
          Destination can break old links.
        </Text>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
};
