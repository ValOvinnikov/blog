import { DIV_AS_CONST, TEXT_ROLE } from '@shinefold/config';
import { Text } from '@shinefold/ui/components/atoms/text';

const SAMPLE = 'The quick brown fox jumps over the lazy dog';

export const TextRoleSpecimens = () => (
  <div className="divide-y divide-border bg-ambient p-6">
    {Object.values(TEXT_ROLE).map((textRole) => (
      <div key={textRole} className="@container/card py-5 first:pt-0">
        <p className="mb-2 font-mono text-label text-text-subtle uppercase">
          {textRole}
        </p>
        <div className="@container/figures">
          <Text as={DIV_AS_CONST} textRole={textRole}>
            {SAMPLE}
          </Text>
        </div>
      </div>
    ))}
  </div>
);
