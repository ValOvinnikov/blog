import type { CSSProperties } from 'react';

import type { TToken } from '../parse-theme-tokens';

import { SpecimenList } from './specimen-list';
import { SpecimenRow } from './specimen-row';
import { SPECIMEN_SAMPLE } from './specimen-sample';

export type TTypeSpecimensProps = {
  tokens: TToken[];
  isFontOnly?: boolean;
};

export const TypeSpecimens = ({ tokens, isFontOnly }: TTypeSpecimensProps) => (
  <SpecimenList>
    {tokens.map((token) => {
      const style: CSSProperties = isFontOnly
        ? { fontFamily: token.value }
        : { fontSize: token.value };
      const descriptor = isFontOnly
        ? `font-${token.name}`
        : `text-${token.name}`;

      return (
        <SpecimenRow key={token.cssVar} label={descriptor}>
          <p style={style}>{SPECIMEN_SAMPLE}</p>
        </SpecimenRow>
      );
    })}
  </SpecimenList>
);
