import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../components/ui/Button';

describe('Button UI Primitive', () => {
  it('renders children correctly', () => {
    render(<Button>Create Invoice</Button>);
    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
  });

  it('renders primary variant with pill styling by default', () => {
    render(<Button variant="primary">Primary Action</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('rounded-full');
    expect(btn.className).toContain('bg-[#000000]');
  });

  it('renders success variant with DukanOS mint accent', () => {
    render(<Button variant="success">Receive Payment</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-[#C1FBD4]');
    expect(btn.className).toContain('text-[#064E3B]');
  });

  it('renders loading spinner and disables click when isLoading is true', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Save Product
      </Button>
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles click events when enabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
