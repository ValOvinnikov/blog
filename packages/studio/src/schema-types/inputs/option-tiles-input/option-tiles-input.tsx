import type { TMaybeUndefined } from '@blog/config/types';
import { isUndefined } from '@blog/utils/primitives';
import { Card, Flex, Grid, Stack, Text } from '@sanity/ui';
import type { ComponentType, ReactNode } from 'react';
import { set, type StringInputProps, unset } from 'sanity';

import { FrameRect, PictureFrame } from './picture-frame';

export type TOptionTile<T extends string> = {
  title: string;
  value: T;
};

type TOptionTilesInputOptions<T extends string> = {
  tiles: readonly TOptionTile<T>[];
  emptyTitle: string;
  Picture: ComponentType<{ value: T }>;
};

type TTileProps = Pick<
  StringInputProps['elementProps'],
  'onFocus' | 'onBlur'
> & {
  title: string;
  tileRef?: StringInputProps['elementProps']['ref'];
  isSelected: boolean;
  isReadOnly: boolean;
  onSelect: () => void;
  picture: ReactNode;
};

const GRID_STYLE = {
  gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
};

const EmptyPicture = () => (
  <PictureFrame>
    <FrameRect rx={3} strokeDasharray="3 2" />
  </PictureFrame>
);

const Tile = ({
  title,
  isSelected,
  isReadOnly,
  onSelect,
  picture,
  tileRef,
  onFocus,
  onBlur,
}: TTileProps) => (
  <Card
    ref={tileRef}
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
    onFocus={onFocus}
    onBlur={onBlur}
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
    schemaType: { title },
    elementProps: {
      id,
      ref,
      onFocus,
      onBlur,
      'aria-describedby': ariaDescribedBy,
    },
  }: StringInputProps) {
    const focusProps = { onFocus, onBlur };

    const select = (next: TMaybeUndefined<T>) =>
      onChange(isUndefined(next) ? unset() : set(next));

    return (
      <Grid
        id={id}
        role="radiogroup"
        aria-label={title}
        aria-describedby={ariaDescribedBy}
        gap={2}
        style={GRID_STYLE}
      >
        <Tile
          title={emptyTitle}
          isSelected={isUndefined(value)}
          isReadOnly={readOnly}
          onSelect={() => select(undefined)}
          tileRef={isUndefined(value) ? ref : undefined}
          {...focusProps}
          picture={<EmptyPicture />}
        />
        {tiles.map((tile) => (
          <Tile
            key={tile.value}
            title={tile.title}
            isSelected={value === tile.value}
            isReadOnly={readOnly}
            onSelect={() => select(tile.value)}
            tileRef={value === tile.value ? ref : undefined}
            {...focusProps}
            picture={<Picture value={tile.value} />}
          />
        ))}
      </Grid>
    );
  };
