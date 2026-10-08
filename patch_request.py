import re

file_path = 'frontend/src/services/api-client.ts'

with open(file_path, 'r') as f:
    content = f.read()

old_logic = """    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }"""

new_logic = """    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const qs = searchParams.toString();
      if (qs) {
        url += url.includes('?') ? `&${qs}` : `?${qs}`;
      }
    }"""

content = content.replace(old_logic, new_logic)

# Also fix the get method so it doesn't add per_page=10000 if the URL already has per_page
old_get_logic = """    const defaultParams = { ...params };
    if (defaultParams.per_page === undefined) {
      defaultParams.per_page = 10000;
    }"""

new_get_logic = """    const defaultParams = { ...params };
    if (defaultParams.per_page === undefined && !url.includes('per_page=')) {
      defaultParams.per_page = 10000;
    }"""

content = content.replace(old_get_logic, new_get_logic)

with open(file_path, 'w') as f:
    f.write(content)

