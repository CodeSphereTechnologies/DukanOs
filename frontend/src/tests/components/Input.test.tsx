import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';

describe('Input and FormField UI Primitives', () => {
  it('renders input with placeholder', () => {
    render(<Input placeholder="Search barcode..." />);
    expect(screen.getByPlaceholderText('Search barcode...')).toBeInTheDocument();
  });

  it('handles typing and value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} data-testid="test-input" />);
    const input = screen.getByTestId('test-input');
    fireEvent.change(input, { target: { value: '8901234567890' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders error state border on error prop', () => {
    render(<Input error="Field required" data-testid="error-input" />);
    const input = screen.getByTestId('error-input');
    expect(input.className).toContain('border-[#DC2626]');
  });

  it('renders FormField with label and error message', () => {
    render(
      <FormField label="Product Name" required error="Product name is required.">
        <Input id="name" />
      </FormField>
    );
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('Product name is required.')).toBeInTheDocument();
  });
});
