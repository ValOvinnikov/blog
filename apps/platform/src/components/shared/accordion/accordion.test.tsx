import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Accordion } from './accordion';

const ControlledAccordion = ({
  initialValue,
}: {
  initialValue?: 'first' | 'second';
}) => {
  const [openValue, setOpenValue] = useState(initialValue);
  return (
    <Accordion openValue={openValue} onOpenValueChange={setOpenValue}>
      <Accordion.Item value="first">
        <Accordion.Trigger>First row</Accordion.Trigger>
        <Accordion.Panel>First body</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="second">
        <Accordion.Trigger>Second row</Accordion.Trigger>
        <Accordion.Panel>Second body</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

describe('Accordion', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('reports the open row through aria-expanded', () => {
    render(<ControlledAccordion initialValue="first" />);

    expect(screen.getByRole('button', { name: 'First row' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Second row' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('First body')).toBeVisible();
  });

  it('closes the open row when another one opens', async () => {
    render(<ControlledAccordion initialValue="first" />);

    await user.click(screen.getByRole('button', { name: 'Second row' }));

    expect(screen.getByRole('button', { name: 'First row' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Second row' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Second body')).toBeVisible();
  });

  it('closes the open row from its own header', async () => {
    render(<ControlledAccordion initialValue="first" />);

    await user.click(screen.getByRole('button', { name: 'First row' }));

    expect(screen.getByRole('button', { name: 'First row' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opens a row with the keyboard', async () => {
    render(<ControlledAccordion />);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: 'First row' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
