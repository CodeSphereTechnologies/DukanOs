import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CustomersPage } from '../../features/customers/pages/CustomersPage';
import { EditCustomerPage } from '../../features/customers/pages/EditCustomerPage';
import { customerService } from '../../services/customer.service';
import type { Customer } from '../../types/customer.types';

const existing: Customer = {
  id: 1,
  name: 'Bilal Traders',
  phone: '+92 300 1234567',
  email: 'bilal@contractors.pk',
  address: 'Shop #4, Model Town',
  current_balance: 1500,
  status: 'active',
};

const FIELD_LABELS = [
  'Full Name / Business Name',
  'Mobile Phone Number',
  'Email Address',
  'Shop / Site Address',
];

describe('customer form parity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('offers every Edit field on the Add form, including Email', async () => {
    // Regression: the Add dialog had no Email input while the Edit form did,
    // so an email could only be attached after creating the customer.
    vi.spyOn(customerService, 'getAll').mockResolvedValue({ success: true, status: 200, data: [] } as never);

    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Customer Accounts & Ledger')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Add Customer'));
    await waitFor(() => expect(screen.getByText('Add Customer Profile')).toBeInTheDocument());

    const dialog = screen.getByText('Add Customer Profile').closest('div[class*="fixed"]') as HTMLElement;
    expect(dialog).toBeTruthy();
    for (const label of FIELD_LABELS) {
      expect(
        withinDialog(dialog).getByText(label),
        `Add form is missing "${label}"`
      ).toBeInTheDocument();
    }
    // The Edit form also lets you pick a status, so Add should too.
    expect(withinDialog(dialog).getByText('Account Status')).toBeInTheDocument();
  });

  it('sends the email when creating a customer', async () => {
    vi.spyOn(customerService, 'getAll').mockResolvedValue({ success: true, status: 200, data: [] } as never);
    const save = vi.spyOn(customerService, 'saveCustomer').mockResolvedValue({ ...existing, id: 2 } as never);

    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Customer Accounts & Ledger')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Customer'));
    await waitFor(() => expect(screen.getByText('Add Customer Profile')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('e.g. Chaudhry Bilal (Contractor)'), {
      target: { value: 'Bilal Traders' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. +92 300 1234567'), {
      target: { value: '+92 300 1234567' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. bilal@contractors.pk'), {
      target: { value: 'bilal@contractors.pk' },
    });
    fireEvent.click(screen.getByText('Create Customer'));

    await waitFor(() => expect(save).toHaveBeenCalled());
    const arg = save.mock.calls[0][0];
    expect(arg.email).toBe('bilal@contractors.pk');
    expect(arg.name).toBe('Bilal Traders');
    expect(arg.phone).toBe('+92 300 1234567');
  });

  it('surfaces a rejected create instead of closing the dialog silently', async () => {
    // Regression: handleAddCustomer had no catch, so a 422 from the backend
    // left an unhandled rejection and the customer appeared to be created.
    vi.spyOn(customerService, 'getAll').mockResolvedValue({ success: true, status: 200, data: [] } as never);
    vi.spyOn(customerService, 'saveCustomer').mockRejectedValue(new Error('The provided data was invalid.'));

    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Customer Accounts & Ledger')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Customer'));
    await waitFor(() => expect(screen.getByText('Add Customer Profile')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('e.g. Chaudhry Bilal (Contractor)'), {
      target: { value: 'Bilal Traders' },
    });
    fireEvent.click(screen.getByText('Create Customer'));

    await waitFor(() => expect(screen.getByText(/provided data was invalid/i)).toBeInTheDocument());
    // Dialog must still be open so the data is not lost.
    expect(screen.getByText('Add Customer Profile')).toBeInTheDocument();
  });

  it('blocks an empty name before calling the service', async () => {
    vi.spyOn(customerService, 'getAll').mockResolvedValue({ success: true, status: 200, data: [] } as never);
    const save = vi.spyOn(customerService, 'saveCustomer');

    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Customer Accounts & Ledger')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Customer'));
    await waitFor(() => expect(screen.getByText('Add Customer Profile')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Customer'));

    await waitFor(() => expect(screen.getByText('Customer name is required.')).toBeInTheDocument());
    expect(save).not.toHaveBeenCalled();
  });

  it('keeps the same field labels on the Edit form', async () => {
    vi.spyOn(customerService, 'getById').mockResolvedValue(existing as never);

    render(
      <MemoryRouter initialEntries={['/customers/1/edit']}>
        <EditCustomerPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Edit Customer Profile')).toBeInTheDocument());

    for (const label of FIELD_LABELS) {
      expect(screen.getByText(label), `Edit form is missing "${label}"`).toBeInTheDocument();
    }
    expect(screen.getByText('Account Status')).toBeInTheDocument();
  });
});

// Scoped query so the list behind the dialog cannot satisfy the lookups.
function withinDialog(dialog: HTMLElement) {
  return {
    getByText: (text: string) => {
      const match = Array.from(dialog.querySelectorAll('label, span')).find(
        (el) => el.textContent?.trim().replace('*', '') === text
      );
      if (!match) throw new Error(`No element with text "${text}" inside the dialog`);
      return match;
    },
  };
}
