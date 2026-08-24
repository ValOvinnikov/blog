import type { TGroupedListGroup } from '@cms/structure/grouped-list';
import { Box, Card, Flex, Stack, Text } from '@sanity/ui';
import { isValidElement, type ComponentType, type ReactNode } from 'react';
import {
  usePaneRouter,
  type PartialListItem,
  type UserComponent,
} from 'sanity/structure';

/**
 * `icon` may be an already-rendered node (element/string) or a component
 * reference to instantiate — including a `forwardRef`/`memo` component,
 * which is an object (`{ $$typeof, render }`), not a function, so
 * `typeof icon === 'function'` alone misses it (e.g. every lucide-react icon).
 */
export const renderIcon = (icon: PartialListItem['icon']): ReactNode => {
  if (!icon) return null;
  if (isValidElement(icon) || typeof icon === 'string') return icon;
  const Icon = icon as ComponentType;
  return <Icon />;
};

/**
 * Renders the `.child()` of a list item built by `groupedList()` — titled,
 * non-interactive group headings over flat clickable rows. `ChildLink` from
 * `usePaneRouter()` is the same navigation primitive a stock `List` pane
 * uses per row, so clicking a row opens the same document/document-type-list
 * pane the underlying `ListItemBuilder` would have opened directly.
 */
export const GroupedListPane: UserComponent = (props) => {
  const { ChildLink } = usePaneRouter();
  const { groups } = props.options as { groups: TGroupedListGroup[] };

  return (
    <Box padding={3}>
      <Stack space={5}>
        {groups.map((group) => (
          <Stack key={group.title} space={3}>
            <Text size={1} weight="semibold" muted={true}>
              {group.title}
            </Text>
            <Card borderBottom={true} paddingBottom={1} />
            <Stack space={1}>
              {group.items.map((item) => {
                const id = item.getId();
                if (!id) return null;

                return (
                  <ChildLink key={id} childId={id}>
                    <Card padding={3} radius={2} tone="transparent">
                      <Flex align="center" gap={3}>
                        {renderIcon(item.getIcon())}
                        <Text size={2}>{item.getTitle()}</Text>
                      </Flex>
                    </Card>
                  </ChildLink>
                );
              })}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};
