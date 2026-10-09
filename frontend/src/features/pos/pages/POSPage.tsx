import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  ShoppingCart,
  ArrowLeft,
  User,
  RotateCcw,
  FileText,
  Receipt,
  Edit,
  Save,
  Phone,
} from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';
import type { Product, Category, Brand } from '../../../types/product.types';
import type { Customer } from '../../../types/customer.types';
import type { InvoiceItem } from '../../../types/invoice.types';
import { productService } from '../../../services/product.service';
import { customerService } from '../../../services/customer.service';
import { invoiceService } from '../../../services/invoice.service';
import { printSalesDocument } from '../../../lib/printDocument';


interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
  stock: number;
}

export const POSPage: React.FC = () => {
  const location = useLocation();
  const [search, setSearch] = useState(location.state?.barcode || '');

  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeBrand, setActiveBrand] = useState<string>('all');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ id: 0, name: 'Walk-in Customer', current_balance: 0, status: 'active' });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card' | 'ledger'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [orderDescription, setOrderDescription] = useState('');
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');

  const [isCompleted, setIsCompleted] = useState(false);
  const [completedDoc, setCompletedDoc] = useState<{ number: string; type: string }>({ number: '', type: 'invoice' });
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDiscount, setEditDiscount] = useState<number>(0);

  const [checkoutCustomerName, setCheckoutCustomerName] = useState('Walk-in Customer');
  const [checkoutCustomerPhone, setCheckoutCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [newCustomerType, setNewCustomerType] = useState<'temporary' | 'permanent'>('temporary');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [customerError, setCustomerError] = useState('');
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    productService.getAll().then((res) => {
      if (res.data) setProducts(res.data.filter((p) => p.status === 'active'));
    });
    productService.getCategories().then((res) => {
      if (res.data) setAllCategories(res.data);
    });
    productService.getBrands().then((res) => {
      if (res.data) setAllBrands(res.data);
    });
    customerService.getAll().then((res) => {
      if (res.data) setCustomers(res.data);
    });
  }, []);

  useEffect(() => {
    if (location.state?.autoAddProduct) {
      setTimeout(() => {
        const raw = location.state.autoAddProduct as Record<string, unknown>;
        const id = Number(raw.id);
        if (!id) return;
        setCart((prev) => {
          const existing = prev.find((i) => i.id === id);
          if (existing) {
            return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
          }
          return [
            ...prev,
            {
              id,
              name: String(raw.name || 'Product'),
              sku: String(raw.sku || ''),
              price: Number(raw.selling_price ?? raw.price) || 0,
              quantity: 1,
              discount: 0,
              stock: Number(raw.current_stock ?? raw.stock) || 0,
            },
          ];
        });
      }, 0);
    }
  }, [location.state]);

  const categories = allCategories.filter((c) => c.status === 'active');
  const brands = allBrands.filter((b) => b.status === 'active');

  let filteredCatalog = products.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode && item.barcode.includes(search))
  );
  if (activeCategory !== 'all') {
    filteredCatalog = filteredCatalog.filter((p) => p.category?.id === Number(activeCategory));
  }
  if (activeBrand !== 'all') {
    filteredCatalog = filteredCatalog.filter((p) => p.brand?.id === Number(activeBrand));
  }

  const addProductToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.selling_price,
          quantity: 1,
          discount: 0,
          stock: product.current_stock,
        },
      ];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setQuantity = (id: number, value: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const qty = Number.isFinite(value) && value > 0 ? value : 1;
            return { ...i, quantity: qty };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const openEditItem = (item: CartItem) => {
    setEditingItem(item);
    setEditQty(item.quantity);
    setEditPrice(item.price);
    setEditDiscount(item.discount);
  };

  const saveEditItem = () => {
    if (!editingItem) return;
    const qty = Number.isFinite(editQty) && editQty > 0 ? editQty : 1;
    const price = Number.isFinite(editPrice) && editPrice >= 0 ? editPrice : 0;
    const discount = Number.isFinite(editDiscount) && editDiscount >= 0 ? editDiscount : 0;
    setCart((prev) =>
      prev.map((i) =>
        i.id === editingItem.id
          ? { ...i, quantity: qty, price, discount, stock: i.stock }
          : i
      )
    );
    setEditingItem(null);
  };

  const lineTotal = (item: CartItem) => item.price * item.quantity - item.discount;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const grandTotalBeforeDocDiscount = subtotal - totalItemDiscount;
  const grandTotal = Math.max(0, grandTotalBeforeDocDiscount - discountInput);

  const resetPOS = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCompleted(false);
    setCompletedDoc({ number: '', type: 'invoice' });
    setDiscountInput(0);
    setOrderDescription('');
    setCustomer({ id: 0, name: 'Walk-in Customer', current_balance: 0, status: 'active' });
    setCheckoutCustomerName('Walk-in Customer');
    setCheckoutCustomerPhone('');
    setSelectedCustomerId(0);
    setCustomerMode('existing');
    setNewCustomerType('temporary');
    setNewCustomerAddress('');
    setCustomerError('');
    setPaymentError('');
    setPaymentMethod('cash');
    setAmountPaid(0);
    setDocType('invoice');
    setIsDiscardOpen(false);
  };

  const handleStartCheckout = () => {
    setAmountPaid(grandTotal);
    setCustomerMode('existing');
    setNewCustomerType('temporary');
    setNewCustomerAddress('');
    setCustomerError('');
    setPaymentError('');
    setCheckoutCustomerName(customer.id === 0 ? 'Walk-in Customer' : customer.name);
    setCheckoutCustomerPhone(customer.phone || '');
    setSelectedCustomerId(customer.id || 0);
    setIsCheckoutOpen(true);
  };

  const handleCompleteSale = async () => {
    setCustomerError('');

    // The Amount Received field is required for every non-ledger payment, but
    // an empty input parses to 0, so the sale used to be recorded with
    // paid_amount 0 and status "partial". Check before any side effects so a
    // rejected checkout never touches stock.
    if (paymentMethod !== 'ledger' && grandTotal > 0 && amountPaid <= 0) {
      setPaymentError(
        `Enter the amount received (${formatCurrency(grandTotal)}) before confirming the sale.`
      );
      return;
    }
    setPaymentError('');

    let finalCustomer: Customer;

    if (customerMode === 'new') {
      const trimmedName = checkoutCustomerName.trim();
      if (!trimmedName || trimmedName.toLowerCase() === 'walk-in customer') {
        setCustomerError('Please enter a valid customer name for the new/temporary customer.');
        return;
      }

      if (paymentMethod === 'ledger' || newCustomerType === 'permanent') {
        // Save to permanent customer accounts
        const saved = await customerService.saveCustomer({
          name: trimmedName,
          phone: checkoutCustomerPhone.trim() || undefined,
          address: newCustomerAddress.trim() || undefined,
          status: 'active',
          current_balance: 0,
        });
        finalCustomer = saved;
        setCustomers((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      } else {
        // Temporary Customer: for this transaction only, not saved into customer accounts directory
        finalCustomer = {
          id: 0,
          name: trimmedName,
          phone: checkoutCustomerPhone.trim() || undefined,
          current_balance: 0,
          status: 'active',
        };
      }
    } else {
      // Existing mode
      if (selectedCustomerId === 0) {
        if (paymentMethod === 'ledger') {
          setCustomerError('On-Account (Ledger) payment cannot be assigned to Walk-in Customer. Please select an existing customer account or save as permanent account.');
          return;
        }
        finalCustomer = {
          id: 0,
          name: checkoutCustomerName.trim() || 'Walk-in Customer',
          phone: checkoutCustomerPhone.trim() || undefined,
          current_balance: 0,
          status: 'active',
        };
      } else {
        const found = customers.find((c) => c.id === selectedCustomerId);
        finalCustomer = found || {
          id: selectedCustomerId,
          name: checkoutCustomerName || 'Walk-in Customer',
          phone: checkoutCustomerPhone || undefined,
          current_balance: 0,
          status: 'active',
        };
      }
    }

    try {
    await Promise.all(
      cart.map(async (item) => {
        await productService.updateStock(item.id, item.quantity);
      })
    );

    const items: InvoiceItem[] = cart.map((item, idx) => ({
      id: idx + 1,
      product_id: item.id,
      product_name: item.name,
      sku: item.sku,
      unit_price: item.price,
      quantity: item.quantity,
      discount_amount: item.discount,
      total_price: item.price * item.quantity - item.discount,
    }));

    let docNumber;
    if (docType === 'invoice') {
      const res = await invoiceService.createInvoice({
        customer_id: finalCustomer.id > 0 ? finalCustomer.id : undefined,
        customer: finalCustomer,
        items,
        subtotal: subtotal - totalItemDiscount,
        discount_amount: discountInput,
        total_amount: grandTotal,
        paid_amount: paymentMethod === 'ledger' ? 0 : amountPaid,
        payment_method: paymentMethod === 'ledger' ? 'other' : paymentMethod,
        payment_status: paymentMethod === 'ledger' ? 'ledger' : amountPaid >= grandTotal ? 'paid' : 'partial',
        notes: orderDescription.trim() || undefined,
      });
      docNumber = res.data?.invoice_number || 'INV-000000';


    } else {
      const res = await invoiceService.createQuotation({
        customer_id: finalCustomer.id > 0 ? finalCustomer.id : undefined,
        customer: finalCustomer,
        items,
        subtotal,
        discount_amount: discountInput,
        total_amount: grandTotal,
        status: 'sent',
        notes: orderDescription.trim() || undefined,
      });
      docNumber = res.data?.quotation_number || 'QTN-000000';
    }

    setCustomer(finalCustomer);
    setCompletedDoc({ number: docNumber, type: docType });
    setIsCompleted(true);
    } catch (err: any) {
      setCustomerError(err.message || 'Failed to complete transaction. Please check your inputs or try again.');
    }
  };

  const handlePrint = () => {
    if (!isCompleted || !completedDoc) return;
    
    printSalesDocument({
      title: completedDoc.type === 'invoice' ? 'INVOICE' : 'QUOTATION',
      number: completedDoc.number,
      customerName: checkoutCustomerName || 'Walk-in Customer',
      customerPhone: checkoutCustomerPhone || undefined,
      items: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        discount_amount: item.discount > 0 ? item.discount : undefined,
      })),
      subtotal: subtotal,
      discountAmount: totalItemDiscount + discountInput,
      totalAmount: grandTotal,
      paymentRows: [
        { label: 'No of Items', value: cart.length.toString() },
        { label: 'Total Qty', value: cart.reduce((acc, item) => acc + item.quantity, 0).toFixed(2) },
        paymentMethod === 'ledger' 
          ? { label: 'Added to Ledger', value: formatCurrency(grandTotal) }
          : { label: 'Amount Paid', value: formatCurrency(amountPaid) }
      ],
      notes: orderDescription.trim() || undefined,
    });
  };



  const customerOptions = [
    { label: 'Walk-in Customer', value: 0, sublabel: 'No account created' },
    ...customers
      .filter((c) => c.status === 'active')
      .map((c) => ({
        label: c.name,
        value: c.id,
        sublabel: c.phone ? c.phone : `Balance: ${formatCurrency(c.current_balance || 0)}`,
      })),
  ];

  return (
    <>
      <div className="print:hidden h-[calc(100vh-112px)] md:h-[calc(100vh-56px)] flex flex-col md:flex-row bg-[#FAFAF8] overflow-hidden">
      {/* Mobile Top Segmented Tab Switcher */}
      <div className="flex md:hidden bg-white border-b border-[#E4E4E7] p-2 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors',
            mobileTab === 'catalog'
              ? 'bg-[#18181B] text-white shadow-xs'
              : 'text-[#71717A] bg-[#F4F4F5] hover:bg-[#E4E4E7]'
          )}
        >
          <span>Catalog & Search</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors',
            mobileTab === 'cart'
              ? 'bg-[#047857] text-white shadow-xs'
              : 'text-[#71717A] bg-[#F4F4F5] hover:bg-[#E4E4E7]'
          )}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
        </button>
      </div>

      {/* Left Column: Product Search & Grid */}
      <div
        className={cn(
          'flex-1 flex-col p-3 sm:p-6 overflow-hidden border-r border-[#E4E4E7]',
          mobileTab === 'cart' ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Search Bar */}
        <div className="mb-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Scan barcode or search name / SKU..."
          />
        </div>

        {/* Category & Brand Filters */}
        <div className="space-y-2.5 mb-3">
          <div>
            <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Categories
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                  activeCategory === 'all'
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                )}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(String(cat.id))}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                    activeCategory === String(cat.id)
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Brands
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
              <button
                type="button"
                onClick={() => setActiveBrand('all')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                  activeBrand === 'all'
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                )}
              >
                All Brands
              </button>
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setActiveBrand(String(brand.id))}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                    activeBrand === String(brand.id)
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 pb-2">
          {filteredCatalog.map((item) => {
            const inCart = cart.find((i) => i.id === item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  'relative p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-sm transition-all',
                  inCart
                    ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                    : 'hover:border-slate-300 hover:shadow-md'
                )}
              >
                <button
                  type="button"
                  onClick={() => addProductToCart(item)}
                  disabled={item.current_stock <= 0}
                  className="text-left flex flex-col justify-between w-full group"
                >
                  <div
                    className={cn(
                      'w-full aspect-square mb-2.5 rounded-lg overflow-hidden flex items-center justify-center relative',
                      item.image_url
                        ? 'bg-slate-50'
                        : 'bg-gradient-to-br from-slate-100 to-slate-200'
                    )}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400 select-none tracking-wide">
                        {item.name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                    {inCart && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600">
                      {item.sku}
                    </span>
                    {item.brand && (
                      <span className="text-[10px] text-slate-400 truncate">{item.brand.name}</span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 line-clamp-2 mt-1 group-hover:text-slate-900">
                    {item.name}
                  </div>
                  {item.category && (
                    <span className="mt-1.5 inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.category.name}
                    </span>
                  )}
                </button>
                <div className="mt-3 flex flex-col pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(item.selling_price)}</span>
                    {inCart ? (
                    <button
                      type="button"
                      onClick={() => addProductToCart(item)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add More
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addProductToCart(item)}
                      disabled={item.current_stock <= 0}
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors',
                        item.current_stock <= 0
                          ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      )}
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  )}
                  </div>
                  {(item.purchase_cost ?? 0) > 0 && (
                    <div className="text-[9px] text-slate-400 font-medium mt-1">Cost: {formatCurrency(item.purchase_cost!)}</div>
                  )}
                  {inCart && (
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredCatalog.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-[#71717A] text-sm">
              No products match your filters.
            </div>
          )}
        </div>

        {/* Mobile Quick Cart Bar when in catalog mode */}
        {cart.length > 0 && (
          <div className="md:hidden pt-2 border-t border-[#E4E4E7]">
            <Button
              variant="success"
              size="md"
              className="w-full font-bold justify-between shadow-md text-xs"
              onClick={() => setMobileTab('cart')}
            >
              <span>{cart.length} item{cart.length > 1 ? 's' : ''} in cart</span>
              <span>View Cart & Pay {formatCurrency(grandTotal)} &rarr;</span>
            </Button>
          </div>
        )}
      </div>

      {/* Right Column: Active Cart & Settlement */}
      <div
        className={cn(
          'w-full md:w-96 lg:w-[400px] bg-white flex-col justify-between border-t md:border-t-0 shadow-lg shrink-0',
          mobileTab === 'catalog' ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Cart Header */}
        <div className="p-3 sm:p-4 border-b border-[#E4E4E7] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileTab('catalog')}
              className="md:hidden p-1.5 -ml-1 text-[#71717A] hover:text-black rounded-lg"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <User className="w-4 h-4 text-[#71717A] shrink-0" />
            <span className="text-xs font-semibold text-black truncate max-w-[170px] sm:max-w-none">
              {customer.name}
            </span>
          </div>
          <span className="text-xs text-[#71717A] shrink-0">{cart.length} items</span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#71717A] text-xs">
              <div>Cart is empty. Scan items or select from catalog.</div>
            </div>
          ) : (
            cart.map((item) => {
              const product = products.find((p) => p.id === item.id);
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-slate-100 to-slate-200">
                    {product?.image_url ? (
                      <img
                        src={product.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-400 select-none tracking-wide">
                        {item.name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-xs truncate leading-tight">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                      <div>{formatCurrency(item.price)} <span className="text-slate-400">x</span> {item.quantity}</div>
                      {(product?.purchase_cost ?? 0) > 0 && (
                        <div className="text-[9px] text-slate-400 font-medium">Cost: {formatCurrency(product!.purchase_cost!)}</div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.id, Number(e.target.value))}
                          className="w-9 text-center font-bold text-slate-900 text-sm bg-transparent border-none outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-sm text-slate-900">
                        {formatCurrency(lineTotal(item))}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditItem(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Settlement Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-700 font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {totalItemDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Item Discount</span>
                <span>-{formatCurrency(totalItemDiscount)}</span>
              </div>
            )}
            {discountInput > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Order Discount</span>
                <span>-{formatCurrency(discountInput)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200 font-display">
              <span>Payable Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="md"
              disabled={cart.length === 0}
              onClick={() => setIsDiscardOpen(true)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs flex-1 !bg-white !border-slate-200 !text-slate-700 hover:!bg-slate-50"
              title="New Order"
            >
              New
            </Button>
            <Button
              variant="secondary"
              size="md"
              disabled={cart.length === 0}
              onClick={() => setCart([])}
              className="text-xs flex-1 !bg-white !border-slate-200 !text-slate-700 hover:!bg-slate-50"
            >
              Clear
            </Button>
            <Button
              variant="success"
              size="md"
              disabled={cart.length === 0}
              onClick={handleStartCheckout}
              className="text-xs font-bold shadow-md flex-[1.4] !bg-emerald-600 hover:!bg-emerald-700"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Discard / New Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDiscardOpen}
        onClose={() => setIsDiscardOpen(false)}
        onConfirm={resetPOS}
        title="Start a New Order?"
        message={
          cart.length > 0
            ? `You have ${cart.length} item(s) in the current order. Starting a new order will discard the current cart. This action cannot be undone.`
            : 'Your cart is currently empty. Start a fresh new order?'
        }
        confirmText="Discard & New Order"
        cancelText="Keep Current Order"
        variant="destructive"
      />

      {/* Edit Cart Item Dialog */}
      <Dialog
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Cart Item"
        description={editingItem ? `Adjust ${editingItem.name}` : ''}
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveEditItem}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Item
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Quantity" required>
            <Input
              type="number"
              min={1}
              max={editingItem?.stock}
              value={editQty}
              onChange={(e) => setEditQty(Number(e.target.value))}
              autoFocus
            />
          </FormField>
          <FormField label="Unit Price (PKR)" required>
            <Input
              type="number"
              min={0}
              value={editPrice}
              onChange={(e) => setEditPrice(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Line Discount (PKR)">
            <Input
              type="number"
              min={0}
              value={editDiscount}
              onChange={(e) => setEditDiscount(Number(e.target.value))}
            />
          </FormField>
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] text-xs flex justify-between items-center">
            <span className="text-[#71717A]">Line Total</span>
            <span className="font-bold text-black">
              {formatCurrency(editPrice * editQty - editDiscount)}
            </span>
          </div>
        </div>
      </Dialog>

      {/* Checkout & Payment Modal */}
      <Dialog
        isOpen={isCheckoutOpen}
        onClose={() => {
          if (isCompleted) resetPOS();
          else setIsCheckoutOpen(false);
        }}
        title={isCompleted ? 'Order Complete' : 'Checkout'}
        maxWidth="xl"
        footer={
          isCompleted ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print {completedDoc.type === 'invoice' ? 'Invoice' : 'Quotation'}
              </Button>
              <Button variant="primary" size="sm" onClick={resetPOS}>
                Done / Next Sale
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button variant="success" size="sm" onClick={handleCompleteSale}>
                Confirm & Save
              </Button>
            </>
          )
        }
      >
        {isCompleted ? (
          <div id="pos-receipt" className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#C1FBD4] text-[#065F46] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-black font-display">
              {completedDoc.type === 'invoice' ? 'Invoice' : 'Quotation'} #{completedDoc.number}
            </h4>
            <p className="text-xs text-[#71717A]">
              Customer: {checkoutCustomerName || 'Walk-in Customer'}
              {customerMode === 'new' && newCustomerType === 'temporary' && (
                <span className="text-amber-700 font-medium"> (Temporary)</span>
              )}
              {customerMode === 'new' && newCustomerType === 'permanent' && (
                <span className="text-[#047857] font-medium"> (New Account)</span>
              )}
            </p>
            <p className="text-xs text-[#71717A]">
              Total: {formatCurrency(grandTotal)}
              {paymentMethod === 'ledger' && (
                <span className="text-[#DC2626]"> (added to customer ledger)</span>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-[#18181B] tracking-tight">Customer Information</span>
                </div>
                <div className="flex items-center bg-white border border-[#E4E4E7] rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('existing');
                      setCustomerError('');
                      if (selectedCustomerId === 0) {
                        setCheckoutCustomerName('Walk-in Customer');
                        setCheckoutCustomerPhone('');
                      } else {
                        const c = customers.find((cust) => cust.id === selectedCustomerId);
                        if (c) {
                          setCheckoutCustomerName(c.name);
                          setCheckoutCustomerPhone(c.phone || '');
                        }
                      }
                    }}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer',
                      customerMode === 'existing'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-[#71717A] hover:text-black hover:bg-[#F4F4F5]'
                    )}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('new');
                      setCustomerError('');
                      if (checkoutCustomerName === 'Walk-in Customer') {
                        setCheckoutCustomerName('');
                      }
                    }}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer',
                      customerMode === 'new'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-[#71717A] hover:text-black hover:bg-[#F4F4F5]'
                    )}
                  >
                    <Plus className="w-3 h-3" />
                    New / Temporary
                  </button>
                </div>
              </div>

              {customerError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span>{customerError}</span>
                </div>
              )}

              {customerMode === 'existing' ? (
                <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
                  <FormField label="Customer Name" required>
                    <Combobox
                      options={customerOptions}
                      value={selectedCustomerId}
                      onChange={(val) => {
                        const id = Number(val);
                        setSelectedCustomerId(id);
                        const opt = customerOptions.find((o) => o.value === id);
                        if (opt && opt.value !== 0) {
                          const c = customers.find((cust) => cust.id === id);
                          setCheckoutCustomerName(opt.label);
                          setCheckoutCustomerPhone(c?.phone || '');
                        } else {
                          setCheckoutCustomerName('Walk-in Customer');
                          setCheckoutCustomerPhone('');
                        }
                      }}
                      onAddNew={(query) => {
                        setCustomerMode('new');
                        setNewCustomerType('temporary');
                        setCheckoutCustomerName(query);
                        setCustomerError('');
                      }}
                      addNewText="Add as New / Temporary Customer"
                      placeholder="Search or select a customer..."
                    />
                  </FormField>
                  <FormField label="Customer Phone Number">
                    <Input
                      type="text"
                      value={checkoutCustomerPhone}
                      onChange={(e) => setCheckoutCustomerPhone(e.target.value)}
                      placeholder="e.g. +92 300 1234567"
                      leftIcon={<Phone className="w-3.5 h-3.5" />}
                    />
                  </FormField>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
                    <FormField label="Customer Name" required>
                      <Input
                        type="text"
                        value={checkoutCustomerName}
                        onChange={(e) => {
                          setCheckoutCustomerName(e.target.value);
                          if (customerError) setCustomerError('');
                        }}
                        placeholder="e.g. Bilal Ahmed / Star Electrical"
                        leftIcon={<User className="w-3.5 h-3.5" />}
                        autoFocus
                      />
                    </FormField>
                    <FormField label="Customer Phone Number">
                      <Input
                        type="text"
                        value={checkoutCustomerPhone}
                        onChange={(e) => setCheckoutCustomerPhone(e.target.value)}
                        placeholder="e.g. +92 300 1234567"
                        leftIcon={<Phone className="w-3.5 h-3.5" />}
                      />
                    </FormField>
                  </div>

                  {/* Customer Type Selector: Temporary vs Save to Directory */}
                  <div className="p-2.5 rounded-lg border border-[#E4E4E7] bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider">
                        Customer Type
                      </span>
                      {newCustomerType === 'temporary' ? (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Temporary Customer
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Permanent Account
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 @lg:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCustomerType('temporary')}
                        className={cn(
                          'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                          newCustomerType === 'temporary'
                            ? 'border-black bg-[#FAFAF8] ring-1 ring-black'
                            : 'border-[#E4E4E7] hover:border-[#A1A1AA] bg-white'
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              newCustomerType === 'temporary' ? 'bg-amber-500' : 'bg-zinc-300'
                            )}
                          />
                          <span className="text-xs font-semibold text-black">Temporary Customer</span>
                        </div>
                        <p className="text-[11px] text-[#71717A] mt-1 leading-snug">
                          For this sale only. Prints name &amp; phone on bill without saving to accounts directory.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewCustomerType('permanent')}
                        className={cn(
                          'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                          newCustomerType === 'permanent'
                            ? 'border-black bg-[#FAFAF8] ring-1 ring-black'
                            : 'border-[#E4E4E7] hover:border-[#A1A1AA] bg-white'
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              newCustomerType === 'permanent' ? 'bg-emerald-600' : 'bg-zinc-300'
                            )}
                          />
                          <span className="text-xs font-semibold text-black">Save to Directory</span>
                        </div>
                        <p className="text-[11px] text-[#71717A] mt-1 leading-snug">
                          Creates a permanent customer account for future visits, credit ledger &amp; histories.
                        </p>
                      </button>
                    </div>

                    {newCustomerType === 'permanent' && (
                      <div className="pt-2 border-t border-[#E4E4E7]">
                        <FormField label="Address / Shop Location (Optional)">
                          <Input
                            type="text"
                            value={newCustomerAddress}
                            onChange={(e) => setNewCustomerAddress(e.target.value)}
                            placeholder="e.g. Shop #12, Market Square, Lahore"
                          />
                        </FormField>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Discount */}
            <FormField label="Discount Given (PKR)">
              <Input
                type="number"
                value={discountInput || ''}
                onChange={(e) => setDiscountInput(Number(e.target.value))}
                placeholder="0"
              />
            </FormField>

            {/* Order Description */}
            <FormField label="Description / Order Notes (Optional)">
              <Textarea
                value={orderDescription}
                onChange={(e) => setOrderDescription(e.target.value)}
                placeholder="Add a custom description or note for this order..."
                rows={2}
              />
            </FormField>

            {/* Document Type Toggle */}
            <FormField label="Document Type">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType('invoice')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 h-[44px] text-sm font-medium rounded-lg border transition-colors',
                    docType === 'invoice'
                      ? 'bg-[#000000] text-white border-black'
                      : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-black'
                  )}
                >
                  <Receipt className="w-4 h-4" />
                  Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('quotation')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 h-[44px] text-sm font-medium rounded-lg border transition-colors',
                    docType === 'quotation'
                      ? 'bg-[#000000] text-white border-black'
                      : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-black'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  Quotation
                </button>
              </div>
            </FormField>

            {/* Payment Method */}
            <FormField label="Payment Method" required>
              <Select
                value={paymentMethod}
                onChange={(e) => {
                  const method = e.target.value as typeof paymentMethod;
                  setPaymentMethod(method);
                  if (method === 'ledger') {
                    if (customerMode === 'new' && newCustomerType === 'temporary') {
                      setNewCustomerType('permanent');
                    }
                  }
                }}
                options={[
                  { label: 'Cash Payment', value: 'cash' },
                  { label: 'Bank Transfer / Online', value: 'bank_transfer' },
                  { label: 'Debit / Credit Card', value: 'card' },
                  ...(docType === 'invoice'
                    ? [{ label: 'On-Account (Customer Ledger)', value: 'ledger' as const }]
                    : []),
                ]}
              />
            </FormField>

            {paymentMethod === 'ledger' && customerMode === 'existing' && selectedCustomerId === 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                ⚠️ On-Account (Ledger) credit sales cannot be assigned to Walk-in Customer. Please select an existing customer account or switch to &ldquo;New / Temporary&rdquo; and choose &ldquo;Save to Directory&rdquo;.
              </div>
            )}
            {paymentMethod === 'ledger' && customerMode === 'new' && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                ℹ️ Customer will be saved to your accounts directory to record ledger debt of {formatCurrency(grandTotal)}.
              </div>
            )}

            {paymentMethod !== 'ledger' && (
              <FormField label="Amount Received (PKR)" required error={paymentError}>
                <Input
                  type="number"
                  min={0}
                  value={amountPaid || ''}
                  onChange={(e) => {
                    setAmountPaid(Number(e.target.value));
                    if (paymentError) setPaymentError('');
                  }}
                  error={paymentError || undefined}
                  autoFocus
                />
              </FormField>
            )}

            <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] text-xs space-y-1">
              <div className="flex justify-between text-[#71717A]">
                <span>Customer:</span>
                <span className="font-semibold text-black max-w-[60%] truncate">
                  {checkoutCustomerName || 'Walk-in Customer'}
                  {customerMode === 'new' ? (
                    newCustomerType === 'temporary' ? (
                      <span className="text-amber-600 font-medium"> (temporary)</span>
                    ) : (
                      <span className="text-[#047857] font-medium"> (new account)</span>
                    )
                  ) : (
                    selectedCustomerId === 0 ? (
                      <span className="text-[#71717A] font-normal"> (walk-in)</span>
                    ) : null
                  )}
                </span>
              </div>
              {checkoutCustomerPhone && (
                <div className="flex justify-between text-[#71717A]">
                  <span>Phone:</span>
                  <span className="font-medium text-black">{checkoutCustomerPhone}</span>
                </div>
              )}
              <div className="flex justify-between text-[#71717A]">
                <span>Subtotal:</span>
                <span className="font-semibold text-black">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Discount:</span>
                <span className="font-semibold text-black">-{formatCurrency(discountInput)}</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Total Bill:</span>
                <span className="font-bold text-black">{formatCurrency(grandTotal)}</span>
              </div>
              {paymentMethod === 'ledger' ? (
                <div className="flex justify-between text-[#DC2626] font-semibold pt-1 border-t border-[#E4E4E7]">
                  <span>Added to Ledger:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              ) : (
                amountPaid > grandTotal && (
                  <div className="flex justify-between text-[#065F46] font-semibold pt-1 border-t border-[#E4E4E7]">
                    <span>Change Return:</span>
                    <span>{formatCurrency(amountPaid - grandTotal)}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>

      </>
  );
};
