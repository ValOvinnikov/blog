import { Card, Flex, Stack, Text } from '@sanity/ui';
import type { TSendStatusView } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-types';

type TSendStatusCardProps = { view: TSendStatusView };

export const SendStatusCard = ({
  view: { tone, icon: Icon, lead, detail, link },
}: TSendStatusCardProps) => {
  const isMuted = tone === 'transparent';

  return (
    <Card tone={tone} padding={3} radius={2} border={!isMuted}>
      <Flex gap={2} align="flex-start">
        {Icon && (
          <Text size={1} muted={isMuted}>
            <Icon />
          </Text>
        )}
        <Stack gap={3}>
          <Text size={1} muted={isMuted}>
            {lead && <strong>{lead}</strong>}
            {detail}
          </Text>
          {link && (
            <Text size={1} weight="semibold">
              <a href={link.href}>{link.label}</a>
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  );
};
