import re

# 1. Fix CreateReturnPage
with open('frontend/src/features/returns/pages/CreateReturnPage.tsx', 'r') as f:
    content = f.read()
content = content.replace("onChange={(val) => setRefundType(val)}", "onChange={(e) => setRefundType(e.target.value)}")
with open('frontend/src/features/returns/pages/CreateReturnPage.tsx', 'w') as f:
    f.write(content)

# 2. Fix ReturnDetailPage
with open('frontend/src/features/returns/pages/ReturnDetailPage.tsx', 'r') as f:
    content = f.read()
content = content.replace(" || item.refund_amount", "")
with open('frontend/src/features/returns/pages/ReturnDetailPage.tsx', 'w') as f:
    f.write(content)

# 3. Fix invoice.types.ts status
with open('frontend/src/types/invoice.types.ts', 'r') as f:
    content = f.read()
content = content.replace("status: 'pending' | 'approved' | 'processed' | 'rejected';", "status: 'pending' | 'approved' | 'processed' | 'rejected' | 'completed';")
with open('frontend/src/types/invoice.types.ts', 'w') as f:
    f.write(content)

# 4. Fix routes/index.tsx
with open('frontend/src/routes/index.tsx', 'r') as f:
    content = f.read()

route_injection = """        <Route
          path="/returns"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier', 'accountant']}>
              <ReturnsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/returns/new"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier']}>
              <CreateReturnPage />
            </RoleRoute>
          }
        />
        <Route
          path="/returns/:id"
          element={
            <RoleRoute allowedRoles={['owner', 'manager', 'cashier', 'accountant']}>
              <ReturnDetailPage />
            </RoleRoute>
          }
        />"""

# Check if already injected
if "/returns" not in content:
    # Inject right before the Quotations route or after Invoices
    content = content.replace(
        '        <Route\n          path="/quotations"',
        f'{route_injection}\n        <Route\n          path="/quotations"'
    )

with open('frontend/src/routes/index.tsx', 'w') as f:
    f.write(content)

