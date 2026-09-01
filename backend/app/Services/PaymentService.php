<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Repositories\InvoiceRepository;
use App\Repositories\PaymentRepository;
use App\Services\Concerns\PostsAccounting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    use PostsAccounting;

    public function __construct(
        private readonly InvoiceRepository $invoices,
        private readonly PaymentRepository $payments,
        private readonly NumberGenerator $numbers,
    ) {}

    /**
     * Record a payment against an invoice (or an on-account payment).
     */
    public function record(User $user, array $data): Payment
    {
        $tenantId = $user->tenant_id;

        return DB::transaction(function () use ($tenantId, $user, $data) {
            $invoice = $data['invoice_id']
                ? $this->invoices->findForTenant($tenantId, $data['invoice_id'])
                : null;

            if ($data['invoice_id'] && ! $invoice) {
                throw ValidationException::withMessages(['invoice_id' => ['The invoice was not found.']]);
            }

            if ($invoice && $invoice->status !== 'issued') {
                throw ValidationException::withMessages(['invoice_id' => ['Cannot record a payment against a voided invoice.']]);
            }

            $amount = (float) $data['amount'];

            if ($invoice && $amount > (float) $invoice->balance_due + 0.001) {
                throw ValidationException::withMessages(['amount' => ['The payment amount exceeds the outstanding balance.']]);
            }

            return $this->createPayment(
                $tenantId,
                $invoice,
                $data['customer_id'] ?? $invoice?->customer_id,
                $amount,
                $data['method'],
                Carbon::parse($data['payment_date'] ?? now()->toDateString()),
                $user->id,
                $data['reference'] ?? null,
                $data['notes'] ?? null,
            );
        });
    }

    /**
     * Create a payment and apply all financial side-effects. Used both by the
     * public record() method and internally when an invoice is paid upfront.
     */
    public function createPayment(
        int $tenantId,
        ?Invoice $invoice,
        ?int $customerId,
        float $amount,
        string $method,
        Carbon $date,
        ?int $userId,
        ?string $reference = null,
        ?string $notes = null,
    ): Payment {
        $number = $this->numbers->next(Payment::class, $tenantId, 'payment_number', 'PAY');

        $payment = Payment::create([
            'tenant_id' => $tenantId,
            'customer_id' => $customerId,
            'invoice_id' => $invoice?->id,
            'payment_number' => $number,
            'amount' => $this->money($amount),
            'method' => $method,
            'reference' => $reference,
            'payment_date' => $date->toDateString(),
            'status' => 'completed',
            'notes' => $notes,
            'created_by' => $userId,
        ]);

        if ($invoice) {
            $this->applyPaymentToInvoice($invoice, $amount);
        }

        if ($customerId) {
            $this->postCustomerLedger(
                $tenantId,
                $customerId,
                'payment',
                0.0,
                $this->money($amount),
                $date,
                $userId,
                Payment::class,
                $payment->id,
                $invoice ? 'Payment received on '.$invoice->invoice_number : 'On-account payment',
            );
        }

        $this->postIncomeForPayment(
            $tenantId,
            $this->money($amount),
            $date,
            $userId,
            Payment::class,
            $payment->id,
            'Payment '.$number,
        );

        return $payment;
    }

    /**
     * Update an invoice's paid/balance/status after a payment.
     */
    public function applyPaymentToInvoice(Invoice $invoice, float $amount): void
    {
        $amountPaid = $this->money((float) $invoice->amount_paid + $amount);
        $balanceDue = $this->money((float) $invoice->total - $amountPaid);

        $invoice->update([
            'amount_paid' => $amountPaid,
            'balance_due' => $balanceDue,
            'payment_status' => match (true) {
                $balanceDue <= 0 => PaymentStatus::Paid->value,
                $amountPaid > 0 => PaymentStatus::Partial->value,
                default => PaymentStatus::Ledger->value,
            },
        ]);
    }
}
