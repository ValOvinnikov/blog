import { buildSlugUrlPreviewPath } from '@cms/schema-types/components/slug-url-preview-path';
import { Card, Stack, Text } from '@sanity/ui';
import type { SlugInputProps } from 'sanity';

/**
 * Wraps a `slug` field's default input with the full resulting route shown
 * beneath it (e.g. `/topics/my-slug`), so an editor sees the real URL while
 * typing rather than just the path segment. `routePrefix` is fixed per
 * schema — `components.input` receives no arguments beyond the field's own
 * props, so each schema gets its own bound instance via this factory.
 */
export function createSlugUrlPreviewInput(routePrefix: string) {
  return function SlugUrlPreviewInput(props: SlugInputProps) {
    return (
      <Stack space={2}>
        {props.renderDefault(props)}
        <Card tone="transparent" padding={3} radius={2}>
          <Text size={1} muted={true}>
            {buildSlugUrlPreviewPath(routePrefix, props.value?.current)}
          </Text>
        </Card>
      </Stack>
    );
  };
}
