import { DIV_AS_CONST, TEXT_ROLE } from '@shinefold/config';
import { Text } from '@shinefold/ui/components/atoms/text';

import { SpecimenList } from './specimen-list';
import { SpecimenRow } from './specimen-row';
import { SPECIMEN_SAMPLE } from './specimen-sample';
import { textRoleSpecimensVariants } from './text-role-specimens-variants';

const THEMES = [false, true];

export const TextRoleSpecimens = () => (
  <div className={textRoleSpecimensVariants().grid()}>
    {THEMES.map((isDark) => {
      const s = textRoleSpecimensVariants({ isDark });

      return (
        <SpecimenList key={String(isDark)} className={s.panel()}>
          {Object.values(TEXT_ROLE).map((textRole) => (
            <SpecimenRow key={textRole} label={textRole} className={s.row()}>
              <div className={s.figures()}>
                <Text as={DIV_AS_CONST} textRole={textRole}>
                  {SPECIMEN_SAMPLE}
                </Text>
              </div>
            </SpecimenRow>
          ))}
        </SpecimenList>
      );
    })}
  </div>
);
