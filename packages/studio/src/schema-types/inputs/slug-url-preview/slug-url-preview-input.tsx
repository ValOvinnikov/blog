import { buildSlugUrlPreviewPath } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-path';
import { Card, Stack, Text } from '@sanity/ui';
import type { SlugInputProps } from 'sanity';

export const SlugUrlPreview = ({
  inputProps,
  path,
}: {
  inputProps: SlugInputProps;
  path: string;
}) => (
  <Stack gap={2}>
    {inputProps.renderDefault(inputProps)}
    <Card tone="transparent" padding={3} radius={2}>
      <Text size={1} muted={true}>
        {path}
      </Text>
    </Card>
  </Stack>
);

// `components.input` receives only the field's own props, so each schema binds its prefix through this factory.
export const createSlugUrlPreviewInput = (routePrefix: string) =>
  function SlugUrlPreviewInput(props: SlugInputProps) {
    return (
      <SlugUrlPreview
        inputProps={props}
        path={buildSlugUrlPreviewPath(routePrefix, props.value?.current)}
      />
    );
  };
