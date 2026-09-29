import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { ArrowLeft, Building2, Check, Globe, Shield, Sparkles } from 'lucide-react';
import { tenantService } from '../../../services/tenant.service';
import { formatError } from '../../../lib/utils';

export const CreateTenantPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [state, setState] = useState('Punjab');
  const [postalCode, setPostalCode] = useState('54000');
  const [currency, setCurrency] = useState('PKR');
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');

  // Initial Admin User Info
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Store Tenant Name is required.');
      return;
    }

    if (!slug.trim()) {
      setError('Tenant Slug is required.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug can only contain lowercase alphanumeric characters and hyphens.');
      return;
    }

    // The owner account is what makes the new store usable, so a half-filled
    // pair is caught here instead of creating a store nobody can sign into.
    if (ownerName.trim() && !ownerEmail.trim()) {
      setError('Owner Login Email is required when an owner name is provided.');
      return;
    }

    if (ownerEmail.trim() && !ownerName.trim()) {
      setError('Owner Full Name is required when an owner email is provided.');
      return;
    }

    if (ownerEmail.trim() && ownerPassword.length < 8) {
      setError('Owner password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Owner credentials must travel with the store: login matches on
      // users.email, so a tenant without an account cannot be signed into.
      const res = await tenantService.create({
        name: name.trim(),
        slug: slug.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        currency,
        timezone,
        status,
        owner_name: ownerName.trim() || undefined,
        owner_email: ownerEmail.trim() || undefined,
        owner_password: ownerPassword || undefined,
        owner_password_confirmation: ownerPassword || undefined,
      });

      // Nothing was persisted when the backend is unreachable, so do not
      // navigate away reporting a store that does not exist.
      if (res.success === false) {
        setError(res.message || 'The backend is unreachable, so the store was not created.');
        setIsSubmitting(false);
        return;
      }

      // Navigate back to tenants list with success flag
      navigate('/super-admin/tenants', {
        state: { message: `Store "${name}" provisioned successfully!` },
      });
    } catch (err: unknown) {
      // Surfaces field errors such as "slug: This slug is already in use."
      setError(formatError(err));
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Provision Store Tenant"
      subtitle="Register a new commercial business entity with isolated multi-tenant database & domain routing."
      secondaryActions={
        <Button
          variant="secondary"
          size="md"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/super-admin/tenants')}
        >
          Back to Tenants
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {error && (
          <Alert variant="error" title="Validation Error">
            {error}
          </Alert>
        )}

        {/* Store Brand & Subdomain Identity */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E4E4E7]">
            <Building2 className="w-5 h-5 text-[#065F46]" />
            <div>
              <h2 className="text-base font-semibold text-[#18181B] font-display">Store Identity & Domain Routing</h2>
              <p className="text-xs text-[#71717A]">Basic naming and public routing parameters for the new store.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Store / Company Name" required description="Official trading name of the retail store.">
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Faisalabad Electric Mart"
                autoFocus
              />
            </FormField>

            <FormField
              label="Tenant Slug (Subdomain)"
              required
              description="Unique routing handle used in store isolation URL."
            >
              <div className="relative">
                <Input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="e.g. faisalabad-electric"
                  className="font-mono text-sm pr-10"
                />
                {slug && (
                  <span className="absolute right-3 top-2.5 text-xs text-[#065F46] font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </FormField>
          </div>

          {/* Subdomain Preview Banner */}
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#52525B]">
              <Globe className="w-4 h-4 text-[#71717A]" />
              <span>Multi-tenant Isolation URL:</span>
            </div>
            <code className="px-2.5 py-1 bg-white border border-[#E4E4E7] rounded-md font-mono text-[#065F46] font-medium">
              https://{slug || 'store-slug'}.dukanos.pk
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Official Contact Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. info@faisalabadelectric.pk"
              />
            </FormField>

            <FormField label="Official Phone Number">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
              />
            </FormField>
          </div>
        </Card>

        {/* Location & Regional Setup */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E4E4E7]">
            <Globe className="w-5 h-5 text-[#065F46]" />
            <div>
              <h2 className="text-base font-semibold text-[#18181B] font-display">Regional & Fiscal Configuration</h2>
              <p className="text-xs text-[#71717A]">Localization settings for currencies, timezones, and regional taxation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="City / Region" required>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Faisalabad"
              />
            </FormField>

            <FormField label="State / Province">
              <Select
                value={state}
                onChange={(e) => setState(e.target.value)}
                options={[
                  { label: 'Punjab', value: 'Punjab' },
                  { label: 'Sindh', value: 'Sindh' },
                  { label: 'Khyber Pakhtunkhwa', value: 'Khyber Pakhtunkhwa' },
                  { label: 'Balochistan', value: 'Balochistan' },
                  { label: 'Islamabad Capital', value: 'Islamabad Capital' },
                  { label: 'Gilgit-Baltistan', value: 'Gilgit-Baltistan' },
                  { label: 'Azad Kashmir', value: 'Azad Kashmir' },
                ]}
              />
            </FormField>

            <FormField label="Postal Code">
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 38000"
              />
            </FormField>
          </div>

          <FormField label="Physical Store Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop #12, Katchery Bazaar, Faisalabad"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Base Currency">
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { label: 'PKR - Pakistani Rupee (Rs.)', value: 'PKR' },
                  { label: 'USD - US Dollar ($)', value: 'USD' },
                  { label: 'AED - UAE Dirham (AED)', value: 'AED' },
                  { label: 'SAR - Saudi Riyal (SAR)', value: 'SAR' },
                  { label: 'EUR - Euro (€)', value: 'EUR' },
                ]}
              />
            </FormField>

            <FormField label="Timezone">
              <Select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={[
                  { label: 'Asia/Karachi (GMT+5) - Pakistan Standard Time', value: 'Asia/Karachi' },
                  { label: 'Asia/Dubai (GMT+4) - Gulf Standard Time', value: 'Asia/Dubai' },
                  { label: 'Asia/Riyadh (GMT+3) - Arabia Standard Time', value: 'Asia/Riyadh' },
                  { label: 'UTC (GMT+0) - Universal Time Coordinated', value: 'UTC' },
                ]}
              />
            </FormField>
          </div>
        </Card>

        {/* Database Isolation & Provisioning Lifecycle */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E4E4E7]">
            <Shield className="w-5 h-5 text-[#065F46]" />
            <div>
              <h2 className="text-base font-semibold text-[#18181B] font-display">Multi-tenant Isolation & Status</h2>
              <p className="text-xs text-[#71717A]">Database provisioning state and immediate operational access.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Initial Lifecycle Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                options={[
                  { label: 'Active - Provision and open for business immediately', value: 'active' },
                  { label: 'Suspended - Provision in locked state (maintenance mode)', value: 'suspended' },
                ]}
              />
            </FormField>

            <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#065F46] shrink-0" />
              <div className="text-xs text-[#52525B]">
                <strong className="text-[#18181B] block mb-0.5">Isolated Multi-Tenant Schema</strong>
                Automatic table schema isolation, automated nightly ledger reconciliation, and tenant-scoped auth tokens.
              </div>
            </div>
          </div>
        </Card>

        {/* Optional Initial Store Owner Account */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E4E4E7]">
            <Building2 className="w-5 h-5 text-[#065F46]" />
            <div>
              <h2 className="text-base font-semibold text-[#18181B] font-display">Primary Store Owner Account (Optional)</h2>
              <p className="text-xs text-[#71717A]">
                Without this account the new store has no one who can sign in — login matches on the
                user email, so leave all three fields empty only if you intend to add staff later.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Owner Full Name">
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Chaudhry Aslam"
              />
            </FormField>

            <FormField label="Owner Login Email">
              <Input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="e.g. owner@faisalabadelectric.pk"
              />
            </FormField>

            <FormField
              label="Owner Login Password"
              helperText="Minimum 8 characters. Share it with the store owner."
              className="md:col-span-2"
            >
              <Input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="e.g. Sport@2026"
                autoComplete="new-password"
              />
            </FormField>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E7]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/super-admin/tenants')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Building2 className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Provisioning Store...' : 'Provision Store Tenant'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
