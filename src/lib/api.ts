// API client for PHP backend
const API_BASE_URL = 'https://ckt-works-inventory.com/api'; // PHP backend URL

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        username,
        password,
      }),
    });

    if (response.success) {
      this.setToken(response.token);
    }

    return response;
  }

  async createUser(userData: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    cw_stamp?: string;
  }) {
    return this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create_user',
        ...userData,
      }),
    });
  }

  async getUsers() {
    return this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_users',
      }),
    });
  }

  async toggleUserStatus(userId: string) {
    return this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'toggle_user_status',
        user_id: userId,
      }),
    });
  }

  async updatePassword(userId: string, newPassword: string) {
    return this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_password',
        user_id: userId,
        new_password: newPassword,
      }),
    });
  }

  async deleteUser(userId: string) {
    return this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete_user',
        user_id: userId,
      }),
    });
  }

  async verifyToken(token: string) {
    return this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'verify_token',
        token,
      }),
    });
  }

  // Orders
  async getHardwareOrders() {
    return this.request('/orders.php?type=hardware');
  }

  async getPTLOrders() {
    return this.request('/orders.php?type=ptl');
  }

  async getPTLOrderProgress() {
    return this.request('/orders.php?type=ptl_progress');
  }

  async createHardwareOrder(orderData: any) {
    return this.request('/orders.php', {
      method: 'POST',
      body: JSON.stringify({
        type: 'hardware',
        data: orderData,
      }),
    });
  }

  async createPTLOrder(orderData: any) {
    return this.request('/orders.php', {
      method: 'POST',
      body: JSON.stringify({
        type: 'ptl',
        data: orderData,
      }),
    });
  }

  async updateHardwareOrder(id: string, orderData: any) {
    return this.request('/orders.php', {
      method: 'PUT',
      body: JSON.stringify({
        type: 'hardware',
        id,
        data: orderData,
      }),
    });
  }

  async updatePTLOrder(id: string, orderData: any) {
    return this.request('/orders.php', {
      method: 'PUT',
      body: JSON.stringify({
        type: 'ptl',
        id,
        data: orderData,
      }),
    });
  }

  // Scanner
  async lookupBoard(qrCode: string) {
    return this.request(`/scanner.php?action=lookup_board&qr_code=${encodeURIComponent(qrCode)}`);
  }

  async countScannedBoards(ptlOrderId: string) {
    return this.request(`/scanner.php?action=count_boards&ptl_order_id=${ptlOrderId}`);
  }

  async getActiveSession(userId?: string) {
    const url = userId 
      ? `/scanner.php?action=active_session&user_id=${userId}`
      : '/scanner.php?action=active_session';
    return this.request(url);
  }

  async getScanHistory(technicianId?: string) {
    const url = technicianId
      ? `/scanner.php?action=scan_history&technician_id=${technicianId}`
      : '/scanner.php?action=scan_history';
    return this.request(url);
  }

  async saveBoardScan(scanData: any) {
    return this.request('/scanner.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'save_board_scan',
        data: scanData,
      }),
    });
  }

  async saveSession(sessionData: {
    session_id: string;
    ptl_order_id: string;
    session_data: any;
    status?: string;
    paused_at?: string;
    break_started_at?: string;
  }) {
    return this.request('/scanner.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'save_session',
        ...sessionData,
      }),
    });
  }

  async deactivateSession(sessionId: string) {
    return this.request('/scanner.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'deactivate_session',
        session_id: sessionId,
      }),
    });
  }
}

export const apiClient = new ApiClient();
export type { ApiClient };