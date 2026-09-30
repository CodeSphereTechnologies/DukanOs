import re

with open('backend/routes/api.php', 'r') as f:
    content = f.read()

# Add to the manage group
old_manage = """        Route::middleware('permission:customers.manage')->group(function () {
            Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
            Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
        });"""

new_manage = """        Route::middleware('permission:customers.manage')->group(function () {
            Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
            Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
            Route::post('customers/{customer}/ledger-entries', [\App\Http\Controllers\Api\V1\Customers\CustomerLedgerAdjustmentController::class, 'store'])->name('customers.ledger-entries.store');
        });"""

content = content.replace(old_manage, new_manage)

with open('backend/routes/api.php', 'w') as f:
    f.write(content)
