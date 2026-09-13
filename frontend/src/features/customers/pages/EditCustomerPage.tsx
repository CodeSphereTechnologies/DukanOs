import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Alert } from '../../../components/ui/Alert';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/ui/LoadingState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Customer } from '../../../types/customer.types';
import { customerService } from '../../../services/customer.service';

export const EditCustomerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [status, setStatus] = useState<Customer['status']>('active');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const cust = await customerService.getById(customerId);
      if (!active) return;
      if (!cust) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCustomer(cust);
      setName(cust.name);
      setPhone(cust.phone || '');
      setEmail(cust.email || '');
      setAddress(cust.address || '');
      setCurrentBalance(cust.current_balance || 0);
      setStatus(cust.status);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [customerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    await customerService.saveCustomer({
      id: customerId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      current_balance: Number(currentBalance) || 0,
      status,
    });

    setSuccess(true);
    setTimeout(() => {
      navigate('/customers');
    }, 800);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (notFound || !customer) {
    return (
      <PageContainer
        title="Customer Not Found"
        secondaryActions={
          <Link
            to="/customers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[#52525B] hover:text-black hover:bg-[#F4F4F5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Link>
        }
      >
        <EmptyState
          title="Customer not found"
          description="This customer may have been deleted, or the link is incorrect."
          action={
            <Button variant="primary" size="md" onClick={() => navigate('/customers')}>
              Go to Customers
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Customer Profile"
      subtitle={`Update details for "${customer.name}". Changes reflect immediately across invoices and the on-account ledger.`}
      secondaryActions={
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[#52525B] hover:text-black hover:bg-[#F4F4F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>
      }
    >
      <div className="max-w-3xl space-y-4">
        {error && (
          <Alert variant="error" title="Validation Error">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" title="Customer updated">
            Customer saved successfully. Redirecting...
          </Alert>
        )}

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 sm:p-6 shadow-subtle">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name / Business Name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chaudhry Bilal (Contractor)"
                />
              </FormField>
              <FormField label="Mobile Phone Number">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                />
              </FormField>
              <FormField label="Email Address">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. bilal@contractors.pk"
                />
              </FormField>
              <FormField label="Shop / Site Address">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop #4, Model Town Market"
                />
              </FormField>
              <FormField label="Outstanding Balance (PKR)">
                <Input
                  type="number"
                  min={0}
                  value={currentBalance || ''}
                  onChange={(e) => setCurrentBalance(Number(e.target.value))}
                />
              </FormField>
              <FormField label="Account Status">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Customer['status'])}
                  options={[
                    { label: 'Active - can purchase on account', value: 'active' },
                    { label: 'Inactive - ledger kept for records', value: 'inactive' },
                  ]}
                />
              </FormField>
            </div>

            <div className="pt-4 border-t border-[#E4E4E7] flex items-center justify-end gap-2">
              <Button variant="secondary" size="md" onClick={() => navigate('/customers')}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        <p className="text-xs text-[#71717A] px-1">
          Outstanding balance is also updated automatically when POS sales are recorded on account and when
          payments are recovered.
        </p>
      </div>
    </PageContainer>
  );
};