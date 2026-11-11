import type { TMaybeUndefined } from '@blog/config/types';
import { isUndefined } from '@blog/utils/primitives';
import { Card, Flex, Grid, Stack, Text } from '@sanity/ui';
import type { ComponentType, ReactNode } from 'react';
import { set, type StringInputProps, unset } from 'sanity';

export type TOptionTile<T extends string> = {
  title: string;
  value: T;
};

type TOptionTilesInputOptions<T extends string> = {
  tiles: readonly TOptionTile<T>[];
  emptyTitle: string;
  Picture: ComponentType<{ value: T }>;
};

type TTileProps = {
  title: string;
  isSelected: boolean;
  isReadOnly: boolean;
  onSelect: () => void;
  picture: ReactNode;
};

const GRID_STYLE = {
  gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
};

const EmptyPicture = () => (
  <svg width={40} height={28} viewBox="0 0 40 28" aria-hidden={true}>
    <rect
      x={4}
      y={4}
      width={32}
      height={20}
      rx={3}
      fill="none"
      stroke="currentColor"
      strokeDasharray="3 2"
    />
  </svg>
);

const Tile = ({
  title,
  isSelected,
  isReadOnly,
  onSelect,
  picture,
}: TTileProps) => (
  <Card
    as="button"
    type="button"
    role="radio"
    aria-checked={isSelected}
    disabled={isReadOnly}
    selected={isSelected}
    border={true}
    radius={2}
    padding={2}
    onClick={onSelect}
  >
    <Stack gap={2}>
      <Flex justify="center">{picture}</Flex>
      <Text size={1} align="center">
        {title}
      </Text>
    </Stack>
  </Card>
);

export const createOptionTilesInput = <T extends string>({
  tiles,
  emptyTitle,
  Picture,
}: TOptionTilesInputOptions<T>) =>
  function OptionTilesInput({
    value,
    onChange,
    readOnly = false,
    elementProps: { id },
  }: StringInputProps) {
    const select = (next: TMaybeUndefined<T>) =>
      onChange(isUndefined(next) ? unset() : set(next));

    return (
      <Grid id={id} role="radiogroup" gap={2} style={GRID_STYLE}>
        <Tile
          title={emptyTitle}
          isSelected={isUndefined(value)}
          isReadOnly={readOnly}
          onSelect={() => select(undefined)}
          picture={<EmptyPicture />}
        />
        {tiles.map((tile) => (
          <Tile
            key={tile.value}
            title={tile.title}
            isSelected={value === tile.value}
            isReadOnly={readOnly}
            onSelect={() => select(tile.value)}
            picture={<Picture value={tile.value} />}
          />
        ))}
      </Grid>
    );
  };
