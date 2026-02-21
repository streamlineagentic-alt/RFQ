const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rfq-production-a291.up.railway.app/api/v1';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, token } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async getProfile(token: string) {
    return this.request('/auth/profile', {
      token,
    });
  }

  // RFQ endpoints
  async createRfq(data: any, token: string) {
    return this.request('/rfqs', {
      method: 'POST',
      body: data,
      token,
    });
  }

  async getRfqs(params: any = {}, token: string) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/rfqs?${queryString}`, {
      token,
    });
  }

  async getRfqById(id: number, token: string) {
    return this.request(`/rfqs/${id}`, {
      token,
    });
  }

  async updateRfq(id: number, data: any, token: string) {
    return this.request(`/rfqs/${id}`, {
      method: 'PATCH',
      body: data,
      token,
    });
  }

  async publishRfq(id: number, token: string) {
    return this.request(`/rfqs/${id}/publish`, {
      method: 'POST',
      token,
    });
  }

  async normalizeRfq(id: string, token: string) {
    return this.request(`/rfqs/${id}/normalize`, {
      method: 'POST',
      token,
    });
  }

  async getMatchingSuppliers(rfqId: string, token: string) {
    return this.request(`/rfqs/${rfqId}/matching-suppliers`, {
      token,
    });
  }

  // Category endpoints
  async getCategories(token: string) {
    return this.request('/categories', { token });
  }

  async createCategory(data: { name: string; slug: string; description?: string }, token: string) {
    return this.request('/categories', { method: 'POST', body: data, token });
  }

  async deleteCategory(id: number, token: string) {
    return this.request(`/categories/${id}`, { method: 'DELETE', token });
  }

  // Supplier endpoints
  async getSuppliers(params: any = {}, token: string) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/suppliers?${queryString}`, { token });
  }

  async getSupplierById(id: number, token: string) {
    return this.request(`/suppliers/${id}`, { token });
  }

  async createSupplier(data: any, token: string) {
    return this.request('/suppliers', { method: 'POST', body: data, token });
  }

  // Quote endpoints
  async getQuotesForRfq(rfqId: number, token: string) {
    return this.request(`/rfqs/${rfqId}/quotes`, { token });
  }

  async submitQuote(rfqId: number, data: any, token: string) {
    return this.request(`/rfqs/${rfqId}/quotes`, {
      method: 'POST',
      body: data,
      token,
    });
  }

  async updateQuoteStatus(rfqId: number, quoteId: number, status: string, token: string) {
    return this.request(`/rfqs/${rfqId}/quotes/${quoteId}/status`, {
      method: 'PATCH',
      body: { status },
      token,
    });
  }

  // Inventory endpoints
  async getInventory(params: Record<string, string>, token: string) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/inventory${qs ? `?${qs}` : ''}`, { token });
  }

  async getInventoryFilters(token: string) {
    return this.request('/inventory/filters', { token });
  }

  async getInventoryItem(id: number, token: string) {
    return this.request(`/inventory/${id}`, { token });
  }

  // Admin endpoints
  async getUsers(token: string) {
    return this.request('/auth/users', { token });
  }

  async updateUserStatus(userId: number, isActive: boolean, token: string) {
    return this.request(`/auth/users/${userId}`, {
      method: 'PATCH',
      body: { isActive },
      token,
    });
  }

  async updateProfile(data: Record<string, any>, token: string) {
    return this.request('/auth/profile', { method: 'PATCH', body: data, token });
  }

  async getMySupplierProfile(token: string) {
    return this.request('/suppliers/me', { token });
  }

  async updateMySupplierProfile(data: Record<string, any>, token: string) {
    return this.request('/suppliers/me', { method: 'PATCH', body: data, token });
  }

  async getQuoteComparison(rfqId: string | number, token: string) {
    return this.request(`/rfqs/${rfqId}/comparison`, { token });
  }

  async saveRecommendation(rfqId: string | number, data: { recommendedQuotes?: any[]; buyerNotes?: string }, token: string) {
    return this.request(`/rfqs/${rfqId}/recommendation`, { method: 'POST', body: data, token });
  }

  async uploadRfqFile(rfqId: string | number, file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${this.baseURL}/rfqs/${rfqId}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
    return data;
  }

  async importInventoryCsv(file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${this.baseURL}/inventory/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Import failed');
    return data;
  }
}

export const apiClient = new ApiClient(API_URL);
