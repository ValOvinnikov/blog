import type { PortableTextPluginsProps } from 'sanity';

export const withTablePlugin = (props: PortableTextPluginsProps) =>
  props.renderDefault({
    ...props,
    plugins: { ...props.plugins, table: { enabled: true } },
  });
