with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

old_button = """          <Button
            variant="primary"
            size="sm"
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            Edit
          </Button>"""

new_button = """          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdjustOpen(true)}
          >
            Adjust Balance
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            Edit
          </Button>"""

content = content.replace(old_button, new_button)

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
