import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Upload,
  Plus,
  X,
  ImagePlus,
  Tag,
  Package,
  CircleDollarSign,
  TrendingUp,
  History,
  FileText,
  CornerDownRight,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Input } from '../../../components/ui/Input';
import { LoadingState } from '../../../components/ui/LoadingState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import type { Product } from '../../../types/product.types';
import type { InvoiceItem, Invoice, Quotation } from '../../../types/invoice.types';
import { productService } from '../../../services/product.service';
import { invoiceService } from '../../../services/invoice.service';
import { formatError } from '../../../lib/utils';

interface SaleRecord {
  docType: 'invoice' | 'quotation';
  number: string;
  date: string;
  customer: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status?: string;
  paymentMethod?: string;
}

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const prod = await productService.getById(productId);
      const inv = await invoiceService.getAll();
      const quo = await invoiceService.getQuotations();
      if (!active) return;
      setProduct(prod);
      setInvoices(inv.data || []);
      setQuotations(quo.data || []);
      setActiveImage(prod?.image_url || prod?.gallery?.[0] || '');
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  const images = useMemo(() => {
    const arr = [...(product?.gallery || [])];
    if (product?.image_url && !arr.includes(product.image_url)) arr.unshift(product.image_url);
    return Array.from(new Set(arr.filter(Boolean)));
  }, [product]);

  const shownImage = activeImage || images[0] || '';

  const persistImages = async (nextImages: string[]) => {
    if (!product) return;
    const updated = await productService.saveProduct({
      ...product,
      image_url: nextImages[0] || product.image_url,
      gallery: nextImages,
    });
    setProduct(updated);
    setActiveImage(nextImages[0] || '');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      persistImages([dataUrl, ...images]);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url || !product) return;
    persistImages([...images.filter((i) => i !== url), url]);
    setImageUrlInput('');
  };

  const handleRemoveImage = async (img: string) => {
    if (!product) return;
    const next = images.filter((i) => i !== img);
    const updated = await productService.saveProduct({
      ...product,
      image_url: next[0] || product.image_url,
      gallery: next,
    });
    setProduct(updated);
    if (activeImage === img) setActiveImage(next[0] || '');
  };

  // ---- Sales information ----
  const salesRecords = useMemo<SaleRecord[]>(() => {
    const rows: SaleRecord[] = [];
    invoices.forEach((inv) => {
      inv.items
        .filter((i: InvoiceItem) => i.product_id === productId)
        .forEach((i: InvoiceItem) =>
          rows.push({
            docType: 'invoice',
            number: inv.invoice_number,
            date: inv.invoice_date || inv.created_at,
            customer: inv.customer?.name || 'Walk-in Customer',
            quantity: i.quantity,
            unitPrice: i.unit_price,
            total: i.total_price,
            status: inv.payment_status,
            paymentMethod: inv.payment_method,
          })
        );
    });
    quotations.forEach((qtn) => {
      qtn.items
        .filter((i: InvoiceItem) => i.product_id === productId)
        .forEach((i: InvoiceItem) =>
          rows.push({
            docType: 'quotation',
            number: qtn.quotation_number,
            date: qtn.quotation_date || qtn.created_at,
            customer: qtn.customer?.name || 'Walk-in Customer',
            quantity: i.quantity,
            unitPrice: i.unit_price,
            total: i.total_price,
            status: qtn.status,
          })
        );
    });
    return rows.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [invoices, quotations, productId]);

  const salesStats = useMemo(() => {
    const units = salesRecords.reduce((sum, r) => sum + r.quantity, 0);
    const revenue = salesRecords.reduce((sum, r) => sum + r.total, 0);
    const invoicesCount = salesRecords.filter((r) => r.docType === 'invoice').length;
    const quotationsCount = salesRecords.filter((r) => r.docType === 'quotation').length;
    const lastSale = salesRecords[0]?.date || null;
    return { units, revenue, invoicesCount, quotationsCount, lastSale };
  }, [salesRecords]);

  const handleArchive = async () => {
    if (!product) return;
    setBusy(true);
    try {
      const updated = await productService.updateStatus(product.id, 'archived');
      if (updated) {
        setProduct(updated);
        setActionError(null);
      }
    } catch (err) {
      setActionError(formatError(err));
    }
    setBusy(false);
    setIsArchiveOpen(false);
  };

  const handleRestore = async () => {
    if (!product) return;
    setBusy(true);
    try {
      const updated = await productService.updateStatus(product.id, 'active');
      if (updated) {
        setProduct(updated);
        setActionError(null);
      }
    } catch (err) {
      setActionError(formatError(err));
    }
    setBusy(false);
  };

  const handleDelete = async () => {
    if (!product) return;
    setBusy(true);
    try {
      await productService.deleteProduct(product.id);
      setActionError(null);
      setBusy(false);
      setIsDeleteOpen(false);
      navigate('/products');
    } catch (err) {
      setActionError(formatError(err));
      setBusy(false);
      setIsDeleteOpen(false);
    }
  };

  const stockValue = (product?.current_stock || 0) * (product?.purchase_cost || 0);
  const isLowStock =
    product &&
    product.current_stock !== 0 &&
    product.current_stock <= (product.min_quantity_threshold || 5);
  const isOutOfStock = product?.current_stock === 0;
  const margin = product ? product.selling_price - (product.purchase_cost || 0) : 0;
  const marginPct = product?.purchase_cost ? (margin / product.purchase_cost) * 100 : 0;

  const statusVariant: Record<Product['status'], 'mint' | 'neutral' | 'outline'> = {
    active: 'mint',
    inactive: 'neutral',
    archived: 'outline',
  };
  const statusLabel: Record<Product['status'], string> = {
    active: 'Active',
    inactive: 'Inactive',
    archived: 'Archived',
  };

  if (loading) {
    return <LoadingState fullPage message="Loading product..." />;
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EmptyState
          title="Product not found"
          description="This product may have been deleted. Go back to the catalog to continue."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/products')}>
              Back to Products
            </Button>
          }
        />
      </div>
    );
  }

  const initials = product.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {actionError && (
        <Alert variant="error" title="Action failed" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            to="/products"
            className="mt-0.5 p-2 rounded-full bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] transition-colors shrink-0"
            aria-label="Back to products"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-display truncate">
                {product.name}
              </h1>
              <Badge variant={statusVariant[product.status]}>{statusLabel[product.status]}</Badge>
            </div>
            <p className="text-xs text-[#71717A] mt-1 font-mono">
              SKU: {product.sku}
              {product.barcode ? ` · Barcode: ${product.barcode}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {product.status === 'archived' ? (
            <Button variant="secondary" size="sm" leftIcon={<ArchiveRestore className="w-3.5 h-3.5" />} onClick={handleRestore} isLoading={busy}>
              Restore to Active
            </Button>
          ) : (
            <Button variant="secondary" size="sm" leftIcon={<Archive className="w-3.5 h-3.5" />} onClick={() => setIsArchiveOpen(true)}>
              Archive
            </Button>
          )}
          <Button variant="primary" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => navigate(`/products/${product.id}/edit`)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setIsDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left column: Images */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#18181B] flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-[#71717A]" /> Product Images
              </h3>
              <Badge variant="neutral" size="sm">
                {images.length} image{images.length === 1 ? '' : 's'}
              </Badge>
            </div>

            <div className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-[#E4E4E7]">
              {shownImage ? (
                <img src={shownImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-slate-300">{initials}</span>
              )}
            </div>

            {images.length > 0 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-thin pb-1">
                {images.map((img) => (
                  <div
                    key={img}
                    className={cnThumb(img === shownImage)}
                    onClick={() => setActiveImage(img)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveImage(img)}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(img);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white flex items-center justify-center"
                      aria-label="Remove image"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                Upload Image
              </Button>
              <div className="flex items-center gap-1.5 flex-1">
                <div className="relative flex-1">
                  <Input
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste image URL..."
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!imageUrlInput.trim()}
                    className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center text-[#047857] disabled:opacity-40"
                    aria-label="Add image from URL"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#71717A] mt-2">
              The first image is used as the main product picture across POS and catalog.
            </p>
          </div>
        </div>

        {/* Right column: details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Overview */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-subtle">
            <h3 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#71717A]" /> Product Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <InfoItem label="Category" value={product.category?.name || 'General'} sub={product.category?.slug} />
              <InfoItem label="Brand" value={product.brand?.name || 'Generic'} sub={product.brand?.slug} />
              <InfoItem label="Unit of Sale" value={product.unit} />
              <InfoItem label="Barcode" value={product.barcode || '—'} mono />
              <InfoItem label="Status" value={statusLabel[product.status]} />
              <InfoItem
                label="Low-Stock Threshold"
                value={new Intl.NumberFormat().format(product.min_quantity_threshold || 5)}
                sub="POS alerts when stock falls to or below this"
              />
            </div>
            {product.description && (
              <div className="mt-4 pt-4 border-t border-[#E4E4E7]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Description
                </div>
                <p className="text-sm text-[#18181B] leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-subtle">
            <h3 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-1.5">
              <CircleDollarSign className="w-4 h-4 text-[#71717A]" /> Pricing &amp; Profitability
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat
                label="Selling Price"
                value={formatCurrency(product.selling_price)}
                accent="#18181B"
              />
              <Stat
                label="Purchase Cost"
                value={formatCurrency(product.purchase_cost || 0)}
                accent="#52525B"
              />
              <Stat
                label="Profit / Unit"
                value={formatCurrency(margin)}
                accent={margin >= 0 ? '#047857' : '#DC2626'}
                sub={product.purchase_cost ? `${marginPct.toFixed(1)}%` : undefined}
              />
              <Stat
                label="Stock Value"
                value={formatCurrency(stockValue)}
                accent="#065F46"
              />
            </div>
          </div>

          {/* Stock */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-subtle">
            <h3 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#71717A]" /> Stock &amp; Inventory
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Current Stock
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isOutOfStock ? 'text-[#DC2626]' : isLowStock ? 'text-[#D97706]' : 'text-[#18181B]'
                  }`}
                >
                  {product.current_stock} <span className="text-sm font-medium text-[#71717A]">{product.unit}</span>
                </div>
                <div className="mt-1">
                  {isOutOfStock ? (
                    <Badge variant="destructive" size="sm">Out of stock</Badge>
                  ) : isLowStock ? (
                    <Badge variant="warning" size="sm">Low stock</Badge>
                  ) : (
                    <Badge variant="mint" size="sm">Healthy</Badge>
                  )}
                </div>
              </div>
              <InfoItem
                label="Low-Stock Threshold"
                value={String(product.min_quantity_threshold || 5)}
                sub="Alerts when stock falls at or below this level"
              />
              <InfoItem
                label="Stock Status on POS"
                value="Auto-synced"
                sub="Sold quantities decrement automatically after each sale"
              />
            </div>
          </div>

          {/* Sales information */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-subtle">
            <h3 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#71717A]" /> Sales Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <Stat
                label="Units Sold"
                value={String(salesStats.units)}
                accent="#18181B"
              />
              <Stat
                label="Total Revenue"
                value={formatCurrency(salesStats.revenue)}
                accent="#047857"
              />
              <div className="flex flex-col justify-center">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Documents
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[#18181B] font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#71717A]" />
                  {salesStats.invoicesCount} invoice{salesStats.invoicesCount === 1 ? '' : 's'}
                  <span className="text-[#A1A1AA]">·</span>
                  {salesStats.quotationsCount} quotation{salesStats.quotationsCount === 1 ? '' : 's'}
                </div>
              </div>
              <InfoItem
                label="Last Sale"
                value={salesStats.lastSale ? formatDate(salesStats.lastSale) : '—'}
                sub={salesStats.lastSale ? '' : 'No sales recorded yet'}
              />
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Sales History
            </div>
            {salesRecords.length === 0 ? (
              <EmptyState
                title="No sales yet"
                description="This product has not appeared on any invoice or quotation. It will track automatically once sold from the POS."
              />
            ) : (
              <div className="border border-[#E4E4E7] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] bg-[#FAFAF8] text-[#71717A] font-semibold">
                      <th className="px-3 py-2.5">Document</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5 text-right">Qty</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-center">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]/60">
                    {salesRecords.slice(0, 12).map((r, idx) => (
                      <tr key={`${r.docType}-${r.number}-${idx}`} className="hover:bg-[#FAFAF8]">
                        <td className="px-3 py-2.5 font-mono text-[#18181B]">{r.number}</td>
                        <td className="px-3 py-2.5 text-[#52525B]">{formatDate(r.date)}</td>
                        <td className="px-3 py-2.5 text-[#52525B] truncate max-w-[160px]">
                          <span className="flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3 text-[#A1A1AA] shrink-0" />
                            {r.customer}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold">{r.quantity} {product.unit}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(r.total)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant={r.docType === 'invoice' ? 'mint' : 'neutral'} size="sm">
                            {r.docType === 'invoice' ? 'Invoice' : 'Quotation'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Archive Confirm */}
      <ConfirmDialog
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchive}
        title="Archive this product?"
        message="This product will be archived and hidden from the POS catalog. You can restore it anytime from the product detail page."
        confirmText="Archive Product"
        isLoading={busy}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this product?"
        message="This permanently removes the product from the catalog. Historical invoices and quotations will still show its name, but the product can no longer be sold. This cannot be undone."
        confirmText="Delete Product"
        variant="destructive"
        isLoading={busy}
      />
    </div>
  );
};

function InfoItem({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">{label}</div>
      <div className={`text-sm text-[#18181B] ${mono ? 'font-mono' : 'font-semibold'}`}>{value}</div>
      {sub && <div className="text-[11px] text-[#A1A1AA] mt-0.5">{sub}</div>}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col justify-center">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">{label}</div>
      <div className="text-lg font-bold leading-tight" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[#A1A1AA] mt-0.5">{sub}</div>}
    </div>
  );
}

function cnThumb(isActive: boolean): string {
  return `relative w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
    isActive ? 'border-[#18181B] ring-1 ring-black' : 'border-[#E4E4E7] hover:border-slate-400'
  }`;
}