import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Plus, Trash2, Pencil, Tags, BadgeCheck } from 'lucide-react';
import type { Category, Brand, Product } from '../../../types/product.types';
import { productService } from '../../../services/product.service';

type Tab = 'categories' | 'brands';

interface CatalogFormState {
  open: boolean;
  mode: 'create' | 'edit';
  id: number | null;
  name: string;
  status: 'active' | 'inactive';
}

const emptyForm: CatalogFormState = {
  open: false,
  mode: 'create',
  id: null,
  name: '',
  status: 'active',
};

export const CatalogPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CatalogFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [cats, brds, prods] = await Promise.all([
      productService.getCategories(),
      productService.getBrands(),
      productService.getAll(),
    ]);
    setCategories(cats.data || []);
    setBrands(brds.data || []);
    setProducts(prods.data || []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
    setForm({ open: true, mode: 'create', id: null, name: '', status: 'active' });

  const openEdit = (id: number, name: string, status: 'active' | 'inactive') =>
    setForm({ open: true, mode: 'edit', id, name, status });

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

    if (tab === 'categories') {
      if (form.mode === 'edit' && form.id !== null) {
        await productService.updateCategory(form.id, { name, status: form.status });
      } else {
        await productService.addCategory(name);
      }
      setCategories((await productService.getCategories()).data || []);
      setSuccessMessage(`Category "${name}" ${form.mode === 'edit' ? 'updated' : 'added'} successfully.`);
    } else {
      if (form.mode === 'edit' && form.id !== null) {
        await productService.updateBrand(form.id, { name, status: form.status });
      } else {
        await productService.addBrand(name);
      }
      setBrands((await productService.getBrands()).data || []);
      setSuccessMessage(`Brand "${name}" ${form.mode === 'edit' ? 'updated' : 'added'} successfully.`);
    }

    setForm(emptyForm);
  };

  const handleToggleStatus = async (id: number) => {
    if (tab === 'categories') {
      const item = categories.find((c) => c.id === id);
      if (!item) return;
      await productService.updateCategory(id, {
        status: item.status === 'active' ? 'inactive' : 'active',
      });
      setCategories((await productService.getCategories()).data || []);
    } else {
      const item = brands.find((b) => b.id === id);
      if (!item) return;
      await productService.updateBrand(id, {
        status: item.status === 'active' ? 'inactive' : 'active',
      });
      setBrands((await productService.getBrands()).data || []);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (tab === 'categories') {
      await productService.deleteCategory(deleteTarget.id);
      setCategories((await productService.getCategories()).data || []);
    } else {
      await productService.deleteBrand(deleteTarget.id);
      setBrands((await productService.getBrands()).data || []);
    }
    setSuccessMessage(`${tab === 'categories' ? 'Category' : 'Brand'} "${deleteTarget.name}" deleted.`);
    setDeleteTarget(null);
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

  return (
    <PageContainer
      title="Categories & Brands"
      subtitle="Manage the catalog taxonomy. Add, rename, and toggle categories and brands that products are assigned to."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreate}
        >
          Add {tab === 'categories' ? 'Category' : 'Brand'}
        </Button>
      }
    >
      <div className="space-y-4">
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
              setTab('categories');
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
              setTab('brands');
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
        </div>

        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={
            tab === 'categories'
              ? 'Search categories by name or slug...'
              : 'Search brands by name or slug...'
          }
        />

        {tab === 'categories' ? (
          <DataTable
            columns={categoryColumns}
            data={filteredCategories}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <DataTable
            columns={brandColumns}
            data={filteredBrands}
            keyExtractor={(item) => item.id}
          />
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={form.open}
        onClose={closeForm}
        title={`${form.mode === 'edit' ? 'Edit' : 'Add'} ${tab === 'categories' ? 'Category' : 'Brand'}`}
        description={
          tab === 'categories'
            ? 'Name the category and set its lifecycle status. Products can be linked to it during creation or edit.'
            : 'Name the brand and set its lifecycle status. Products can be linked to it during creation or edit.'
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeForm}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              {form.mode === 'edit' ? 'Save Changes' : `Add ${tab === 'categories' ? 'Category' : 'Brand'}`}
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

          <FormField label={`${tab === 'categories' ? 'Category' : 'Brand'} Name`} required>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={
                tab === 'categories' ? 'e.g. Industrial Switches' : 'e.g. Sequential Brand'
              }
              autoFocus
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
        title={`Delete this ${tab === 'categories' ? 'category' : 'brand'}?`}
        message={`This permanently removes "${deleteTarget?.name}". Products already linked to it will keep its name on old records, but will no longer be associated. This cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={false}
      />
    </PageContainer>
  );
};