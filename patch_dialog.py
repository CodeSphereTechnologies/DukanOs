with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

dialog = """
      <Dialog
        isOpen={isAdjustOpen}
        onClose={() => !isAdjusting && setIsAdjustOpen(false)}
        title="Adjust Ledger Balance"
        description={`Record a manual transaction for ${customer?.name}. This will update their balance and print a voucher.`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAdjustOpen(false)} disabled={isAdjusting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdjustLedger} isLoading={isAdjusting}>
              Confirm & Print
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdjustLedger} className="space-y-4">
          <FormField label="Transaction Type" required>
            <Select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as 'add' | 'subtract')}
              options={[
                { label: 'Receive Payment (Subtract Debt)', value: 'subtract' },
                { label: 'Add Charge (Increase Debt)', value: 'add' }
              ]}
            />
          </FormField>
          
          <FormField label="Amount (PKR)" required>
            <Input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 5000"
              min="0"
              step="0.01"
              autoFocus
            />
          </FormField>

          <FormField label="Description / Reason" required>
            <Input
              value={adjustDesc}
              onChange={(e) => setAdjustDesc(e.target.value)}
              placeholder="e.g. Received cash payment"
            />
          </FormField>
        </form>
      </Dialog>
"""

# Find the end of the CustomerDetailPage component
target = """        >
          Back to All Customers
        </Button>
      </div>
    </div>
  );
};"""

replacement = """        >
          Back to All Customers
        </Button>
      </div>""" + dialog + """
    </div>
  );
};"""

content = content.replace(target, replacement)

# Fix 'active' being unused
content = content.replace("      if (!active) return;", "")
content = content.replace("let active = true;", "")

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
