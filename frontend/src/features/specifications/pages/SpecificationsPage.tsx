import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import { Plus, Trash2 } from 'lucide-react';
import { specificationService } from '../../../services/specification.service';
import type { Specification } from '../../../types/product.types';

export const SpecificationsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [specs, setSpecs] = useState<Specification[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [dataType, setDataType] = useState<Specification['data_type']>('text');
  const [unit, setUnit] = useState('');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(true);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);

  const loadSpecs = async () => {
    const res = await specificationService.getAll();
    if (res.data) setSpecs(res.data);
  };

  useEffect(() => {
    loadSpecs();
  }, []);

  useEffect(() => {
    if (location.search.includes('create=true') || location.pathname.endsWith('/create')) {
      setIsAddOpen(true);
    }
  }, [location]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugEdited) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  const handleResetForm = () => {
    setName('');
    setSlug('');
    setIsSlugEdited(false);
    setDataType('text');
    setUnit('');
    setOptionsStr('');
    setIsRequired(false);
    setIsFilterable(true);
    setStatus('active');
    setError(null);
  };

  const handleAddSpecification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Specification Name is required.');
      return;
    }

    if (!slug.trim()) {
      setError('Specification Slug is required.');
      return;
    }

    let parsedValues: string[] | undefined = undefined;
    if (dataType === 'select') {
      if (!optionsStr.trim()) {
        setError('Please provide at least one option for select-type specification.');
        return;
      }
      parsedValues = optionsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    try {
      const res = await specificationService.create({
        name: name.trim(),
        slug: slug.trim(),
        data_type: dataType,
        unit: unit.trim() || undefined,
        values: parsedValues,
        is_required: isRequired,
        is_filterable: isFilterable,
        status,
      });

      if (res.data) {
        setSpecs((prev) => [res.data!, ...prev.filter((s) => s.id !== res.data!.id)]);
      }

      setSuccessMessage(`Specification "${name}" created successfully.`);
      setIsAddOpen(false);
      handleResetForm();

      if (location.pathname.endsWith('/create')) {
        navigate('/super-admin/specifications', { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create specification');
    }
  };

  const handleToggleStatus = async (id: number) => {
    const res = await specificationService.toggleStatus(id);
    if (res.data) {
      setSpecs((prev) => prev.map((s) => (s.id === id ? res.data! : s)));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this specification?')) {
      await specificationService.delete(id);
      setSpecs((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filteredSpecs = specs.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.unit && s.unit.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Specification>[] = [
    {
      key: 'name',
      header: 'Specification Name',
      render: (s) => (
        <div>
          <div className="font-semibold text-[#18181B]">{s.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{s.slug}</div>
          {s.values && s.values.length > 0 && (
            <div className="text-[11px] text-[#52525B] mt-0.5">
              Options: <span className="text-[#18181B]">{s.values.join(', ')}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'data_type',
      header: 'Data Type',
      align: 'center',
      render: (s) => (
        <Badge variant="neutral" className="uppercase text-[11px]">
          {s.data_type}
        </Badge>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (s) => s.unit || '—',
    },
    {
      key: 'is_required',
      header: 'Required',
      align: 'center',
      render: (s) => (
        <span
          className={`text-xs font-medium ${
            s.is_required ? 'text-[#DC2626]' : 'text-[#71717A]'
          }`}
        >
          {s.is_required ? 'Mandatory' : 'Optional'}
        </span>
      ),
    },
    {
      key: 'is_filterable',
      header: 'Filterable',
      align: 'center',
      render: (s) => (
        <Badge variant={s.is_filterable ? 'mint' : 'neutral'}>
          {s.is_filterable ? 'YES' : 'NO'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (s) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(s.id)}
          title="Click to toggle status"
          className="cursor-pointer transition-opacity hover:opacity-80"
        >
          <Badge variant={s.status === 'active' ? 'mint' : 'destructive'}>
            {s.status.toUpperCase()}
          </Badge>
        </button>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <button
          type="button"
          onClick={() => handleDelete(s.id)}
          title="Delete specification"
          className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] hover:bg-[#F4F4F5] rounded transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Dynamic Specifications Engine"
      subtitle="Define platform-wide product specifications (Wattage, Voltage, Dimensions) dynamically."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddOpen(true)}
        >
          Create Specification
        </Button>
      }
    >
      <div className="space-y-4">
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search specifications by name, slug, or unit..."
        />

        <DataTable columns={columns} data={filteredSpecs} keyExtractor={(item) => item.id} />
      </div>

      {/* Create Specification Dialog Modal */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          handleResetForm();
        }}
        title="Create Product Specification"
        description="Configure a dynamic electrical or dimensional attribute applicable across all store products."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAddOpen(false);
                handleResetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddSpecification}>
              Save Specification
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSpecification} className="space-y-4">
          {error && (
            <Alert variant="error" title="Validation Error">
              {error}
            </Alert>
          )}

          <FormField label="Specification Name" required>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Blade Sweep Size, Operating Frequency"
              autoFocus
            />
          </FormField>

          <FormField label="Attribute Slug (Code identifier)" required>
            <Input
              value={slug}
              onChange={(e) => {
                setIsSlugEdited(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              placeholder="e.g. blade-sweep-size"
              className="font-mono"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Data Type" required>
              <Select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as Specification['data_type'])}
                options={[
                  { label: 'Text (Single line string)', value: 'text' },
                  { label: 'Number (Numeric quantity / rating)', value: 'number' },
                  { label: 'Select (Predefined dropdown options)', value: 'select' },
                  { label: 'Boolean (Yes / No toggle)', value: 'boolean' },
                ]}
              />
            </FormField>

            <FormField label="Measurement Unit (Optional)">
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. W, V, Inches, RPM, Months"
              />
            </FormField>
          </div>

          {dataType === 'select' && (
            <FormField
              label="Select Options (Comma separated)"
              required
              description="Enter predefined selectable choices separated by commas."
            >
              <Input
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="e.g. 56'', 48'', 36'' or 220V, 240V, 110V"
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Field Requirement">
              <Select
                value={isRequired ? 'required' : 'optional'}
                onChange={(e) => setIsRequired(e.target.value === 'required')}
                options={[
                  { label: 'Optional for catalog products', value: 'optional' },
                  { label: 'Mandatory for catalog products', value: 'required' },
                ]}
              />
            </FormField>

            <FormField label="Catalog Search Filter">
              <Select
                value={isFilterable ? 'yes' : 'no'}
                onChange={(e) => setIsFilterable(e.target.value === 'yes')}
                options={[
                  { label: 'Filterable in POS & Catalog', value: 'yes' },
                  { label: 'Standard display only', value: 'no' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Lifecycle Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              options={[
                { label: 'Active - Available for product assignment', value: 'active' },
                { label: 'Inactive - Temporarily hidden from new products', value: 'inactive' },
              ]}
            />
          </FormField>
        </form>
      </Dialog>
    </PageContainer>
  );
};
