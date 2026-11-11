import { faker } from '@faker-js/faker';
import { List } from 'lucide-react';

export const mockStructureSchema = () => ({
  name: faker.string.alpha(12),
  title: faker.lorem.words(2),
  icon: List,
});
