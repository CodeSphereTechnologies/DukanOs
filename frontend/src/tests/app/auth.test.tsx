import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '../../features/auth/components/LoginForm';
import { DemoAccountPicker } from '../../features/auth/components/DemoAccountPicker';

describe('Auth Feature Components', () => {
  it('validates empty email and password submission in LoginForm', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /sign in to dukanos/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Email address is required.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('validates invalid email format', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    const emailInput = screen.getByPlaceholderText('name@punjabelectric.pk');
    fireEvent.change(emailInput, { target: { value: 'notanemail' } });

    const submitBtn = screen.getByRole('button', { name: /sign in to dukanos/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
  });

  it('submits valid credentials to onSubmit handler', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={handleSubmit} />);

    const emailInput = screen.getByPlaceholderText('name@punjabelectric.pk');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'owner@punjabelectric.pk' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });

    const submitBtn = screen.getByRole('button', { name: /sign in to dukanos/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'owner@punjabelectric.pk',
      password: 'password',
    });
  });

  it('renders all 5 seeded demo role buttons in DemoAccountPicker', () => {
    const handleSelect = vi.fn();
    render(<DemoAccountPicker onSelectAccount={handleSelect} />);

    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Store Owner')).toBeInTheDocument();
    expect(screen.getByText('Store Manager')).toBeInTheDocument();
    expect(screen.getByText('Cashier')).toBeInTheDocument();
    expect(screen.getByText('Accountant')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Super Admin'));
    expect(handleSelect).toHaveBeenCalledWith('admin@dukanos.com');
  });
});
