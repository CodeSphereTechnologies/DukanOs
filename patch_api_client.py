import re

file_path = 'frontend/src/services/api-client.ts'

with open(file_path, 'r') as f:
    content = f.read()

# We need to change:
# public async get<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
#   return this.request<T>('GET', url, undefined, params);
# }

new_get = """  public async get<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    // DukanOS uses a local-first architecture for the SPA UI (like DataTable), which 
    // expects all records for client-side filtering and rendering.
    // However, the backend controllers default to `per_page=25`.
    // We override this by requesting a large page size for all GET requests to prevent data disappearing.
    const defaultParams = { ...params };
    if (defaultParams.per_page === undefined) {
      defaultParams.per_page = 10000;
    }
    return this.request<T>('GET', url, undefined, defaultParams);
  }"""

content = re.sub(
    r'public async get<T>\(url: string, params\?: Record<string, string \| number \| boolean \| undefined>\): Promise<ApiResponse<T>> \{\s*return this\.request<T>\(\'GET\', url, undefined, params\);\s*\}',
    new_get,
    content
)

with open(file_path, 'w') as f:
    f.write(content)

