<?php

use App\Http\Controllers\Api\V1\Admin\AuditLogController;
use App\Http\Controllers\Api\V1\Admin\TenantController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Catalog\BrandController;
use App\Http\Controllers\Api\V1\Catalog\CategoryController;
use App\Http\Controllers\Api\V1\Catalog\InventoryController;
use App\Http\Controllers\Api\V1\Catalog\ProductController;
use App\Http\Controllers\Api\V1\Catalog\SpecificationController;
use App\Http\Controllers\Api\V1\Customers\CustomerController;
use App\Http\Controllers\Api\V1\Finance\DailyTransactionController;
use App\Http\Controllers\Api\V1\Finance\LedgerCategoryController;
use App\Http\Controllers\Api\V1\Payroll\EmployeeController;
use App\Http\Controllers\Api\V1\Payroll\SalaryController;
use App\Http\Controllers\Api\V1\Reports\ReportController;
use App\Http\Controllers\Api\V1\Sales\InvoiceController;
use App\Http\Controllers\Api\V1\Sales\PaymentController;
use App\Http\Controllers\Api\V1\Sales\QuotationController;
use App\Http\Controllers\Api\V1\Sales\SaleReturnController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('v1.')->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [AuthController::class, 'login'])
            ->middleware('throttle:6,1')
            ->name('login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::post('logout-all', [AuthController::class, 'logoutAll'])->name('logout-all');
            Route::get('me', [AuthController::class, 'me'])->name('me');
            Route::put('profile', [AuthController::class, 'updateProfile'])->name('profile.update');
            Route::put('password', [AuthController::class, 'updatePassword'])->name('password.update');
            Route::get('tokens', [AuthController::class, 'tokens'])->name('tokens.index');
            Route::delete('tokens/{tokenId}', [AuthController::class, 'revokeToken'])->name('tokens.revoke');
        });
    });

    /*
    |------------------------------------------------------------------
    | Super Admin (platform level)
    |------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
        Route::apiResource('tenants', TenantController::class);
        // Status-only lifecycle toggle; apiResource's PUT requires name and slug.
        Route::patch('tenants/{tenant}/status', [TenantController::class, 'updateStatus'])->name('tenants.status');

        Route::get('specifications', [SpecificationController::class, 'index'])->name('specifications.index');
        Route::post('specifications', [SpecificationController::class, 'store'])->name('specifications.store');
        Route::get('specifications/{specification}', [SpecificationController::class, 'show'])->name('specifications.show');
        Route::put('specifications/{specification}', [SpecificationController::class, 'update'])->name('specifications.update');
        Route::delete('specifications/{specification}', [SpecificationController::class, 'destroy'])->name('specifications.destroy');
    });

    /*
    |------------------------------------------------------------------
    | Tenant-scoped resources
    |------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {
        // Catalog
        Route::middleware('permission:products.view')->group(function () {
            Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
            Route::get('categories/{category}', [CategoryController::class, 'show'])->name('categories.show');
            Route::get('brands', [BrandController::class, 'index'])->name('brands.index');
            Route::get('brands/{brand}', [BrandController::class, 'show'])->name('brands.show');
            Route::get('products', [ProductController::class, 'index'])->name('products.index');
            Route::get('products/barcode', [ProductController::class, 'byBarcode'])->name('products.barcode');
            Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');
            Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
            Route::get('inventory/{product}/transactions', [InventoryController::class, 'transactions'])->name('inventory.transactions');
        });

        Route::middleware('permission:products.create')->group(function () {
            Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
            Route::post('brands', [BrandController::class, 'store'])->name('brands.store');
            Route::post('products', [ProductController::class, 'store'])->name('products.store');
        });

        Route::middleware('permission:products.update')->group(function () {
            Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
            Route::put('brands/{brand}', [BrandController::class, 'update'])->name('brands.update');
            Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
            Route::post('inventory/{product}/adjust', [InventoryController::class, 'adjust'])->name('inventory.adjust');
        });

        Route::middleware('permission:products.delete')->group(function () {
            Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
            Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->name('brands.destroy');
            Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
        });

        // Customers
        Route::middleware('permission:customers.view')->group(function () {
            Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
            Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
            Route::get('customers/{customer}/ledger', [CustomerController::class, 'ledger'])->name('customers.ledger');
            Route::get('customers/{customer}/invoices', [CustomerController::class, 'invoices'])->name('customers.invoices');
        });

        Route::middleware('permission:customers.manage')->group(function () {
            Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
            Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
        });

        // Invoices
        Route::middleware('permission:invoices.view')->group(function () {
            Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
            Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
        });
        Route::middleware('permission:invoices.create')->group(function () {
            Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
            Route::post('invoices/{invoice}/void', [InvoiceController::class, 'void'])->name('invoices.void');
        });

        // Quotations
        Route::middleware('permission:quotations.manage')->group(function () {
            Route::get('quotations', [QuotationController::class, 'index'])->name('quotations.index');
            Route::post('quotations', [QuotationController::class, 'store'])->name('quotations.store');
            Route::get('quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show');
            Route::patch('quotations/{quotation}/status', [QuotationController::class, 'updateStatus'])->name('quotations.status');
            Route::post('quotations/{quotation}/convert', [QuotationController::class, 'convert'])->name('quotations.convert');
        });

        // Payments
        Route::middleware('permission:payments.manage')->group(function () {
            Route::get('payments', [PaymentController::class, 'index'])->name('payments.index');
            Route::post('payments', [PaymentController::class, 'store'])->name('payments.store');
            Route::get('payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
        });

        // Returns
        Route::middleware('permission:returns.manage')->group(function () {
            Route::get('returns', [SaleReturnController::class, 'index'])->name('returns.index');
            Route::post('returns', [SaleReturnController::class, 'store'])->name('returns.store');
            Route::get('returns/{return}', [SaleReturnController::class, 'show'])->name('returns.show');
        });

        // Daily ledger
        Route::middleware('permission:ledger.view')->group(function () {
            Route::get('ledger-categories', [LedgerCategoryController::class, 'index'])->name('ledger-categories.index');
            Route::get('daily-transactions', [DailyTransactionController::class, 'index'])->name('daily-transactions.index');
        });
        Route::middleware('permission:expenses.manage')->group(function () {
            Route::post('ledger-categories', [LedgerCategoryController::class, 'store'])->name('ledger-categories.store');
            Route::put('ledger-categories/{category}', [LedgerCategoryController::class, 'update'])->name('ledger-categories.update');
            Route::delete('ledger-categories/{category}', [LedgerCategoryController::class, 'destroy'])->name('ledger-categories.destroy');
            Route::post('daily-transactions', [DailyTransactionController::class, 'store'])->name('daily-transactions.store');
        });

        // Payroll
        Route::middleware('permission:payroll.manage')->group(function () {
            Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
            Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
            Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
            Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
            Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

            Route::get('salary-records', [SalaryController::class, 'index'])->name('salary-records.index');
            Route::post('salary-records', [SalaryController::class, 'generate'])->name('salary-records.generate');
            Route::patch('salary-records/{salary}/mark-paid', [SalaryController::class, 'markPaid'])->name('salary-records.mark-paid');
        });

        // Reports
        Route::middleware('permission:reports.financial')->group(function () {
            Route::get('reports/dashboard', [ReportController::class, 'dashboard'])->name('reports.dashboard');
            Route::get('reports/financial', [ReportController::class, 'financial'])->name('reports.financial');
            Route::get('reports/customer-balances', [ReportController::class, 'customerBalances'])->name('reports.customer-balances');
        });
        Route::middleware('permission:reports.view')->group(function () {
            Route::get('reports/sales', [ReportController::class, 'sales'])->name('reports.sales');
            Route::get('reports/inventory', [ReportController::class, 'inventory'])->name('reports.inventory');
        });

        // Users (store users) + audit logs
        Route::middleware('permission:users.manage')->group(function () {
            Route::get('users', [UserController::class, 'index'])->name('users.index');
            Route::post('users', [UserController::class, 'store'])->name('users.store');
            Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
            Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
            Route::patch('users/{user}/status', [UserController::class, 'updateStatus'])->name('users.status');
            Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        });

        Route::middleware('permission:audit.view')->group(function () {
            Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
        });
    });
});
