import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Plus, Minus, Trash2, CheckCircle2, User, Printer } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';

interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
}

const CATALOG_ITEMS = [
  { id: 1, name: 'Royal Deluxe Fan 56"', sku: 'ROY-FAN-56', barcode: '8901234567890', price: 9500, stock: 12, category: 'Fans' },
  { id: 2, name: 'Pakistan Cables 7/29 Single Core Red', sku: 'PAK-CAB-729R', barcode: '8901234567891', price: 14500, stock: 8, category: 'Cables' },
  { id: 3, name: 'Philips LED Bulb 18W Cool Daylight', sku: 'PHI-LED-18W', barcode: '8901234567892', price: 650, stock: 45, category: 'Lighting' },
  { id: 4, name: 'Schneider MCB 32A Double Pole', sku: 'SCH-MCB-32DP', barcode: '8901234567893', price: 2200, stock: 24, category: 'Breakers' },
  { id: 5, name: 'Pak Fan Bracket Fan 18" Remote', sku: 'PAK-FAN-18B', barcode: '8901234567894', price: 12800, stock: 6, category: 'Fans' },
  { id: 6, name: 'Osaka Tube Light LED 36W Complete', sku: 'OSK-TUB-36W', barcode: '8901234567895', price: 1850, stock: 30, category: 'Lighting' },
];

export const POSPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: 'Royal Deluxe Fan 56"', sku: 'ROY-FAN-56', price: 9500, quantity: 2, discount: 0 },
    { id: 3, name: 'Philips LED Bulb 18W Cool Daylight', sku: 'PHI-LED-18W', price: 650, quantity: 4, discount: 0 },
  ]);
  const [customer, setCustomer] = useState('Walk-in Customer');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card' | 'ledger'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedInvoiceNumber, setCompletedInvoiceNumber] = useState('');

  const filteredCatalog = CATALOG_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode.includes(search)
  );

  const addToCart = (product: typeof CATALOG_ITEMS[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: product.id, name: product.name, sku: product.sku, price: product.price, quantity: 1, discount: 0 }];
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

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const grandTotal = subtotal - totalDiscount;

  const handleStartCheckout = () => {
    setAmountPaid(grandTotal);
    setIsCheckoutOpen(true);
  };

  const handleCompleteSale = () => {
    setCompletedInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setIsCompleted(true);
  };

  const resetPOS = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCompleted(false);
    setCompletedInvoiceNumber('');
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col md:flex-row bg-[#FAFAF8] overflow-hidden">
      {/* Left Column: Product Search & Grid */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden border-r border-[#E4E4E7]">
        {/* Search Bar */}
        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Scan barcode (e.g. 890123...) or search name/SKU..."
          />
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredCatalog.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addToCart(item)}
              className="p-3 bg-white border border-[#E4E4E7] rounded-xl text-left hover:border-black transition-all hover:shadow-sm flex flex-col justify-between group active:scale-98"
            >
              <div>
                <span className="text-[11px] font-mono text-[#71717A] group-hover:text-black">{item.sku}</span>
                <div className="text-xs font-semibold text-[#18181B] line-clamp-2 mt-1">{item.name}</div>
              </div>
              <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-[#E4E4E7]/60">
                <span className="text-xs font-bold text-black">{formatCurrency(item.price)}</span>
                <span className="text-[10px] text-[#71717A]">{item.stock} in stock</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Active Cart & Settlement */}
      <div className="w-full md:w-96 lg:w-[420px] bg-white flex flex-col justify-between border-t md:border-t-0 shadow-lg shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-[#E4E4E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#71717A]" />
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="text-xs font-semibold text-black bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="Walk-in Customer">Walk-in Customer</option>
              <option value="Al-Madina Construction">Al-Madina Construction</option>
              <option value="Tariq Electric Works">Tariq Electric Works</option>
              <option value="Chaudhry Bilal (Contractor)">Chaudhry Bilal (Contractor)</option>
            </select>
          </div>
          <span className="text-xs text-[#71717A]">{cart.length} items</span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#71717A] text-xs">
              <div>Cart is empty. Scan items or select from catalog.</div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="p-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAF8] flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-semibold text-[#18181B] truncate">{item.name}</div>
                  <div className="text-[11px] text-[#71717A]">{formatCurrency(item.price)} each</div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-[#E4E4E7] rounded-full px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 text-[#71717A] hover:text-black rounded-full"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-black">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 text-[#71717A] hover:text-black rounded-full"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="w-20 text-right font-bold text-black">
                    {formatCurrency(item.price * item.quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-[#DC2626] hover:bg-[#FEE2E2] rounded-full ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Settlement Footer */}
        <div className="p-4 border-t border-[#E4E4E7] bg-[#FAFAF8] space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#71717A]">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-[#065F46] font-medium">
                <span>Discount</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#18181B] pt-2 border-t border-[#E4E4E7] font-display">
              <span>Payable Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="secondary"
              size="md"
              disabled={cart.length === 0}
              onClick={() => setCart([])}
              className="text-xs"
            >
              Clear Cart
            </Button>
            <Button
              variant="success"
              size="md"
              disabled={cart.length === 0}
              onClick={handleStartCheckout}
              className="text-xs font-bold shadow-md"
            >
              Pay {formatCurrency(grandTotal)}
            </Button>
          </div>
        </div>
      </div>

      {/* Checkout & Payment Modal */}
      <Dialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={isCompleted ? 'Payment Recorded' : 'Receive Counter Payment'}
        maxWidth="md"
        footer={
          isCompleted ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-3.5 h-3.5" />}>
                Print Receipt
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
                Confirm Payment
              </Button>
            </>
          )
        }
      >
        {isCompleted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#C1FBD4] text-[#065F46] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-black font-display">
              Invoice #{completedInvoiceNumber || 'INV-000000'}
            </h4>
            <p className="text-xs text-[#71717A]">
              Payment of {formatCurrency(amountPaid)} recorded via {paymentMethod.toUpperCase()}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <FormField label="Payment Method" required>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                options={[
                  { label: 'Cash Payment', value: 'cash' },
                  { label: 'Bank Transfer / Online', value: 'bank_transfer' },
                  { label: 'Debit / Credit Card', value: 'card' },
                  { label: 'On-Account (Customer Ledger)', value: 'ledger' },
                ]}
              />
            </FormField>

            <FormField label="Amount Received (PKR)" required>
              <Input
                type="number"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                autoFocus
              />
            </FormField>

            <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] text-xs space-y-1">
              <div className="flex justify-between text-[#71717A]">
                <span>Customer:</span>
                <span className="font-semibold text-black">{customer}</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Total Bill:</span>
                <span className="font-bold text-black">{formatCurrency(grandTotal)}</span>
              </div>
              {amountPaid > grandTotal && (
                <div className="flex justify-between text-[#065F46] font-semibold pt-1 border-t border-[#E4E4E7]">
                  <span>Change Return:</span>
                  <span>{formatCurrency(amountPaid - grandTotal)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
