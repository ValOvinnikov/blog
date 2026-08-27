import { render, screen } from '@admin/testing/custom-render';

import { Card } from './card';

describe(Card, () => {
  it('renders the header title through a level-3 heading', () => {
    render(
      <Card>
        <Card.Header title="Tenant details" />
      </Card>,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Tenant details' }),
    ).toBeVisible();
  });

  it('renders the header title at a caller-supplied heading level', () => {
    render(
      <Card>
        <Card.Header title="Tenant details" headingLevel={2} />
      </Card>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tenant details' }),
    ).toBeVisible();
  });

  it('renders a header description when provided', () => {
    render(
      <Card>
        <Card.Header
          title="Tenant details"
          supportingText="Core identity and status."
        />
      </Card>,
    );
    expect(screen.getByText('Core identity and status.')).toBeVisible();
  });

  it('omits the header description when not provided', () => {
    render(
      <Card>
        <Card.Header title="Tenant details" />
      </Card>,
    );
    expect(screen.queryByText(/core identity/i)).toBeNull();
  });

  it('renders header actions when provided', () => {
    render(
      <Card>
        <Card.Header
          title="Tenant details"
          actions={<button type="button">Edit</button>}
        />
      </Card>,
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  it('omits header actions when not provided', () => {
    render(
      <Card>
        <Card.Header title="Tenant details" />
      </Card>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders body content', () => {
    render(
      <Card>
        <Card.Body>Body copy goes here.</Card.Body>
      </Card>,
    );
    expect(screen.getByText('Body copy goes here.')).toBeVisible();
  });

  it('renders footer content', () => {
    render(
      <Card>
        <Card.Footer>
          <button type="button">Save</button>
        </Card.Footer>
      </Card>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('renders header, body, and footer together regardless of JSX order', () => {
    render(
      <Card>
        <Card.Footer>Footer text</Card.Footer>
        <Card.Body>Body text</Card.Body>
        <Card.Header title="Ordered card" />
      </Card>,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Ordered card' }),
    ).toBeVisible();
    expect(screen.getByText('Body text')).toBeVisible();
    expect(screen.getByText('Footer text')).toBeVisible();
  });

  it('renders with only a body, without throwing', () => {
    expect(() =>
      render(
        <Card>
          <Card.Body>Just a body.</Card.Body>
        </Card>,
      ),
    ).not.toThrow();
    expect(screen.getByText('Just a body.')).toBeVisible();
  });

  it('merges a caller-supplied className on the root', () => {
    const { container } = render(
      <Card className="custom-class">
        <Card.Body>Content</Card.Body>
      </Card>,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
