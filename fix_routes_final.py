import re

with open('frontend/src/routes/index.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { InvoiceDetailPage } from '../features/invoices/pages/InvoiceDetailPage';", "import { InvoiceDetailPage } from '../features/invoices/pages/InvoiceDetailPage';\nimport { ReturnsPage } from '../features/returns/pages/ReturnsPage';\nimport { CreateReturnPage } from '../features/returns/pages/CreateReturnPage';\nimport { ReturnDetailPage } from '../features/returns/pages/ReturnDetailPage';")

# Add routes
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
        />
"""

content = content.replace('        <Route\n          path="/quotations"', route_injection + '        <Route\n          path="/quotations"')

with open('frontend/src/routes/index.tsx', 'w') as f:
    f.write(content)
