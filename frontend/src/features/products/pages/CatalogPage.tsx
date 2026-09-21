import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import { Plus, Trash2, Pencil, Tags, BadgeCheck, Ruler } from 'lucide-react';
import type { Category, Brand, Unit, Product } from '../../../types/product.types';
import { productService } from '../../../services/product.service';
import { unitService } from '../../../services/unit.service';
import { formatError } from '../../../lib/utils';

type Tab = 'categories' | 'brands' | 'units';

function toTab(value: string | null): Tab {
  return value === 'brands' || value === 'units' ? value : 'categories';
}

interface CatalogFormState {
  open: boolean;
  mode: 'create' | 'edit';
  id: number | null;
  name: string;
  code: string;
  status: 'active' | 'inactive';
}

const emptyForm: CatalogFormState = {
  open: false,
  mode: 'create',
  id: null,
  name: '',
  code: '',
  status: 'active',
};

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => toTab(searchParams.get('tab')));
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CatalogFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [cats, brds, prods, unts] = await Promise.all([
      productService.getCategories(),
      productService.getBrands(),
      productService.getAll(),
      unitService.getAll(),
    ]);
    setCategories(cats.data || []);
    setBrands(brds.data || []);
    setProducts(prods.data || []);
    setUnits(unts.data || []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    setTab(toTab(searchParams.get('tab')));
  }, [searchParams]);

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setSearchParams({ tab: next });
  };

  const counts = useMemo(() => {
    const catCount = new Map<number, number>();
    const brandCount = new Map<number, number>();
    products.forEach((p) => {
      if (p.category?.id) catCount.set(p.category.id, (catCount.get(p.category.id) || 0) + 1);
      if (p.brand?.id) brandCount.set(p.brand.id, (brandCount.get(p.brand.id) || 0) + 1);
    });
    return { catCount, brandCount };
  }, [products]);

  const handleNameChange = (val: string) => {
    setForm((prev) => ({ ...prev, name: val }));
  };

  const openCreate = () =>
    setForm({ open: true, mode: 'create', id: null, name: '', code: '', status: 'active' });

  const openEdit = (id: number, name: string, status: 'active' | 'inactive', code?: string) =>
    setForm({ open: true, mode: 'edit', id, name, code: code || '', status });

  const closeForm = () => {
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError('Name is required.');
      return;
    }

    try {
      if (tab === 'categories') {
        if (form.mode === 'edit' && form.id !== null) {
          const updated = await productService.updateCategory(form.id, { name, status: form.status });
          if (updated) {
            setCategories((prev) => prev.map((c) => (c.id === form.id ? updated : c)));
          }
        } else {
          const created = await productService.addCategory(name);
          setCategories((prev) => [created, ...prev]);
        }
        setSuccessMessage(`Category "${name}" ${form.mode === 'edit' ? 'updated' : 'added'} successfully.`);
      } else if (tab === 'brands') {
        if (form.mode === 'edit' && form.id !== null) {
          const updated = await productService.updateBrand(form.id, { name, status: form.status });
          if (updated) {
            setBrands((prev) => prev.map((b) => (b.id === form.id ? updated : b)));
          }
        } else {
          const created = await productService.addBrand(name);
          setBrands((prev) => [created, ...prev]);
        }
        setSuccessMessage(`Brand "${name}" ${form.mode === 'edit' ? 'updated' : 'added'} successfully.`);
      } else {
        const code = form.code.trim();
        if (!code) {
          setError('Code is required.');
          return;
        }
        if (form.mode === 'edit' && form.id !== null) {
          const updated = await unitService.update(form.id, { code, name, status: form.status });
          if (updated) {
            setUnits((prev) => prev.map((u) => (u.id === form.id ? updated : u)));
          }
        } else {
          const created = await unitService.add({ code, name });
          setUnits((prev) => [created, ...prev]);
        }
        setSuccessMessage(`Unit "${name} (${code})" ${form.mode === 'edit' ? 'updated' : 'added'} successfully.`);
      }

      setForm(emptyForm);
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      if (tab === 'categories') {
        const item = categories.find((c) => c.id === id);
        if (!item) return;
        const updated = await productService.updateCategory(id, {
          status: item.status === 'active' ? 'inactive' : 'active',
        });
        if (updated) {
          setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        }
      } else if (tab === 'brands') {
        const item = brands.find((b) => b.id === id);
        if (!item) return;
        const updated = await productService.updateBrand(id, {
          status: item.status === 'active' ? 'inactive' : 'active',
        });
        if (updated) {
          setBrands((prev) => prev.map((b) => (b.id === id ? updated : b)));
        }
      } else {
        const item = units.find((u) => u.id === id);
        if (!item) return;
        const updated = await unitService.update(id, {
          status: item.status === 'active' ? 'inactive' : 'active',
        });
        if (updated) {
          setUnits((prev) => prev.map((u) => (u.id === id ? updated : u)));
        }
      }
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (tab === 'categories') {
        await productService.deleteCategory(deleteTarget.id);
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      } else if (tab === 'brands') {
        await productService.deleteBrand(deleteTarget.id);
        setBrands((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      } else {
        await unitService.delete(deleteTarget.id);
        setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      }
      const label =
        tab === 'categories' ? 'Category' : tab === 'brands' ? 'Brand' : 'Unit of Sale';
      setSuccessMessage(`${label} "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(formatError(err));
    }
  };

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase())
      ),
    [categories, search]
  );

  const filteredBrands = useMemo(
    () =>
      brands.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.slug.toLowerCase().includes(search.toLowerCase())
      ),
    [brands, search]
  );

  const filteredUnits = useMemo(
    () =>
      units.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.code.toLowerCase().includes(search.toLowerCase())
      ),
    [units, search]
  );

  const categoryColumns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category Name',
      render: (c) => (
        <div>
          <div className="font-semibold text-[#18181B]">{c.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{c.slug}</div>
        </div>
      ),
    },
    {
      key: 'product_count',
      header: 'Linked Products',
      align: 'center',
      render: (c) => (
        <Badge variant={counts.catCount.get(c.id) ? 'mint' : 'neutral'}>
          {counts.catCount.get(c.id) || 0}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (c) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(c.id)}
          title="Click to toggle status"
          className="cursor-pointer transition-opacity hover:opacity-80"
        >
          <Badge variant={c.status === 'active' ? 'mint' : 'destructive'}>
            {c.status.toUpperCase()}
          </Badge>
        </button>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="link"
            size="sm"
            leftIcon={<Pencil className="w-3 h-3" />}
            onClick={() => openEdit(c.id, c.name, c.status)}
            className="text-[#047857] hover:text-[#18181B]"
            title="Edit"
          >
            Edit
          </Button>
          <Button
            variant="link"
            size="sm"
            leftIcon={<Trash2 className="w-3 h-3" />}
            onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
            className="text-[#DC2626] hover:text-[#18181B]"
            title="Delete"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const brandColumns: Column<Brand>[] = [
    {
      key: 'name',
      header: 'Brand Name',
      render: (b) => (
        <div>
          <div className="font-semibold text-[#18181B]">{b.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{b.slug}</div>
        </div>
      ),
    },
    {
      key: 'product_count',
      header: 'Linked Products',
      align: 'center',
      render: (b) => (
        <Badge variant={counts.brandCount.get(b.id) ? 'mint' : 'neutral'}>
          {counts.brandCount.get(b.id) || 0}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (b) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(b.id)}
          title="Click to toggle status"
          className="cursor-pointer transition-opacity hover:opacity-80"
        >
          <Badge variant={b.status === 'active' ? 'mint' : 'destructive'}>
            {b.status.toUpperCase()}
          </Badge>
        </button>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="link"
            size="sm"
            leftIcon={<Pencil className="w-3 h-3" />}
            onClick={() => openEdit(b.id, b.name, b.status)}
            className="text-[#047857] hover:text-[#18181B]"
            title="Edit"
          >
            Edit
          </Button>
          <Button
            variant="link"
            size="sm"
            leftIcon={<Trash2 className="w-3 h-3" />}
            onClick={() => setDeleteTarget({ id: b.id, name: b.name })}
            className="text-[#DC2626] hover:text-[#18181B]"
            title="Delete"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const unitColumns: Column<Unit>[] = [
    {
      key: 'code',
      header: 'Unit of Sale',
      render: (u) => (
        <div>
          <div className="font-semibold text-[#18181B]">{u.name}</div>
          <div className="text-xs text-[#71717A] font-mono">{u.code}</div>
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Used by Products',
      align: 'center',
      render: (u) => (
        <Badge variant={products.some((p) => p.unit === u.code) ? 'mint' : 'neutral'}>
          {products.filter((p) => p.unit === u.code).length}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (u) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(u.id)}
          title="Click to toggle status"
          className="cursor-pointer transition-opacity hover:opacity-80"
        >
          <Badge variant={u.status === 'active' ? 'mint' : 'destructive'}>
            {u.status.toUpperCase()}
          </Badge>
        </button>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="link"
            size="sm"
            leftIcon={<Pencil className="w-3 h-3" />}
            onClick={() => openEdit(u.id, u.name, u.status, u.code)}
            className="text-[#047857] hover:text-[#18181B]"
            title="Edit"
          >
            Edit
          </Button>
          <Button
            variant="link"
            size="sm"
            leftIcon={<Trash2 className="w-3 h-3" />}
            onClick={() => setDeleteTarget({ id: u.id, name: `${u.name} (${u.code})` })}
            className="text-[#DC2626] hover:text-[#18181B]"
            title="Delete"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Categories, Brands & Units"
      subtitle="Manage the catalog taxonomy. Add, rename, and toggle categories, brands, and units of sale that products use."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreate}
        >
          Add {tab === 'categories' ? 'Category' : tab === 'brands' ? 'Brand' : 'Unit of Sale'}
        </Button>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="error" title="Unable to save" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E4E4E7]">
          <button
            type="button"
            onClick={() => {
              handleTabChange('categories');
              setSearch('');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === 'categories'
                ? 'border-black text-black'
                : 'border-transparent text-[#71717A] hover:text-black'
            }`}
          >
            <Tags className="w-4 h-4" />
            Categories
            <Badge variant={tab === 'categories' ? 'mint' : 'neutral'}>{categories.length}</Badge>
          </button>
          <button
            type="button"
            onClick={() => {
              handleTabChange('brands');
              setSearch('');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === 'brands'
                ? 'border-black text-black'
                : 'border-transparent text-[#71717A] hover:text-black'
            }`}
          >
            <BadgeCheck className="w-4 h-4" />
            Brands
            <Badge variant={tab === 'brands' ? 'mint' : 'neutral'}>{brands.length}</Badge>
          </button>
          <button
            type="button"
            onClick={() => {
              handleTabChange('units');
              setSearch('');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === 'units'
                ? 'border-black text-black'
                : 'border-transparent text-[#71717A] hover:text-black'
            }`}
          >
            <Ruler className="w-4 h-4" />
            Units
            <Badge variant={tab === 'units' ? 'mint' : 'neutral'}>{units.length}</Badge>
          </button>
        </div>

        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={
            tab === 'categories'
              ? 'Search categories by name or slug...'
              : tab === 'brands'
                ? 'Search brands by name or slug...'
                : 'Search units by name or code...'
          }
        />

        {tab === 'categories' ? (
          <DataTable
            columns={categoryColumns}
            data={filteredCategories}
            keyExtractor={(item) => item.id}
          />
        ) : tab === 'brands' ? (
          <DataTable
            columns={brandColumns}
            data={filteredBrands}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <DataTable
            columns={unitColumns}
            data={filteredUnits}
            keyExtractor={(item) => item.id}
          />
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={form.open}
        onClose={closeForm}
        title={`${form.mode === 'edit' ? 'Edit' : 'Add'} ${
          tab === 'categories' ? 'Category' : tab === 'brands' ? 'Brand' : 'Unit of Sale'
        }`}
        description={
          tab === 'categories' || tab === 'brands'
            ? 'Name it and set its lifecycle status. Products can be linked to it during creation or edit.'
            : 'Enter the unit code and display name. Products can then select it during creation or edit.'
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeForm}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              {form.mode === 'edit'
                ? 'Save Changes'
                : `Add ${tab === 'categories' ? 'Category' : tab === 'brands' ? 'Brand' : 'Unit of Sale'}`}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="error" title="Validation Error">
              {error}
            </Alert>
          )}

          {tab === 'units' && (
            <FormField label="Unit Code" required>
              <Input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. pc, coil, m, box"
                className="font-mono"
                autoFocus
              />
            </FormField>
          )}

          <FormField label={`${tab === 'categories' ? 'Category' : tab === 'brands' ? 'Brand' : 'Unit'} Name`} required>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={
                tab === 'categories'
                  ? 'e.g. Industrial Switches'
                  : tab === 'brands'
                    ? 'e.g. Sequential Brand'
                    : 'e.g. Piece'
              }
              autoFocus={tab !== 'units'}
            />
          </FormField>

          <FormField label="Lifecycle Status">
            <Select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              options={[
                { label: 'Active - Available for product assignment', value: 'active' },
                { label: 'Inactive - Temporarily hidden from new products', value: 'inactive' },
              ]}
            />
          </FormField>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete this ${tab === 'categories' ? 'category' : tab === 'brands' ? 'brand' : 'unit'}?`}
        message={`This permanently removes "${deleteTarget?.name}". Products already linked to it will keep its name on old records, but will no longer be associated. This cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={false}
      />
    </PageContainer>
  );
};