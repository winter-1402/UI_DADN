/**
 * API Configuration File
 * Centralized API endpoints for the Dryer Factory Frontend
 * Update this file when backend endpoints change
 */

// Base URL - Update this based on your environment
const API_BASE_URL = 'http://localhost:3000/api/v1';

// ============================================================================
// AUTH APIs
// ============================================================================
export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,           // POST: { email, password }
  logout: `${API_BASE_URL}/auth/logout`,         // POST
  me: `${API_BASE_URL}/auth/me`,                 // GET: Get current user info and scopes
};

// ============================================================================
// USER MANAGEMENT APIs
// ============================================================================
export const USER_ENDPOINTS = {
  list: `${API_BASE_URL}/users`,                 // GET: List all users (admin only)
  create: `${API_BASE_URL}/users`,               // POST: Create new user (admin only)
  update: (userId: number) => `${API_BASE_URL}/users/${userId}`,  // PATCH: Update user
  delete: (userId: number) => `${API_BASE_URL}/users/${userId}`,  // DELETE: Delete user
  updateScope: (userId: number) => `${API_BASE_URL}/users/${userId}/scope`,  // PATCH: Update user scope
  listScopes: (userId: number) => `${API_BASE_URL}/users/${userId}/scope`,   // GET: Get user scopes
};

// ============================================================================
// FACTORY STRUCTURE APIs
// ============================================================================
export const FACTORY_ENDPOINTS = {
  // Factories
  factories: {
    list: `${API_BASE_URL}/factories`,           // GET: List all factories
    create: `${API_BASE_URL}/factories`,         // POST: Create factory (admin only)
    get: (factoryId: number) => `${API_BASE_URL}/factories/${factoryId}`,
    update: (factoryId: number) => `${API_BASE_URL}/factories/${factoryId}`,  // PATCH
    delete: (factoryId: number) => `${API_BASE_URL}/factories/${factoryId}`,
  },
  
  // Areas
  areas: {
    list: `${API_BASE_URL}/areas`,               // GET: List areas (with optional fac_id filter)
    create: `${API_BASE_URL}/areas`,             // POST: Create area (admin only)
    get: (areaId: number) => `${API_BASE_URL}/areas/${areaId}`,
    update: (areaId: number) => `${API_BASE_URL}/areas/${areaId}`,  // PATCH
    delete: (areaId: number) => `${API_BASE_URL}/areas/${areaId}`,
  },
  
  // Dryers
  dryers: {
    list: `${API_BASE_URL}/dryers`,              // GET: List dryers (with optional area_id filter)
    create: `${API_BASE_URL}/dryers`,            // POST: Create dryer (admin only)
    get: (dryerId: number) => `${API_BASE_URL}/dryers/${dryerId}`,
    update: (dryerId: number) => `${API_BASE_URL}/dryers/${dryerId}`,  // PATCH
    delete: (dryerId: number) => `${API_BASE_URL}/dryers/${dryerId}`, // GET: Get dryer status
  },
  
  // Sensors
  sensors: {
    list: `${API_BASE_URL}/sensors`,             // GET: List sensors (with optional dry_id filter)
    create: `${API_BASE_URL}/sensors`,           // POST: Create sensor (admin only)
    get: (sensorId: number) => `${API_BASE_URL}/sensors/${sensorId}`,
    update: `${API_BASE_URL}/sensor-data`,  // PATCH
    delete: (sensorId: number) => `${API_BASE_URL}/sensors/${sensorId}`,
    data: (sensorId: number) => `${API_BASE_URL}/sensors/${sensorId}/data`,  // GET: Get sensor data
  },
  
  // Controls
  controls: {
    list: `${API_BASE_URL}/controls`,            // GET: List controls (with optional dry_id filter)
    create: `${API_BASE_URL}/controls`,          // POST: Create control (admin only)
    get: (controlId: number) => `${API_BASE_URL}/controls/${controlId}`,
    update: (controlId: number) => `${API_BASE_URL}/controls/${controlId}`,  // PATCH
    delete: (controlId: number) => `${API_BASE_URL}/controls/${controlId}`,
    execute: (controlId: number) => `${API_BASE_URL}/controls/${controlId}/execute`,  // POST: Execute control
  },
};

// ============================================================================
// CATALOG APIs (Fruits, Recipes, Policies)
// ============================================================================
export const CATALOG_ENDPOINTS = {
  // Fruits
  fruits: {
    list: `${API_BASE_URL}/fruits`,              // GET: List all fruits
    create: `${API_BASE_URL}/fruits`,            // POST: Create fruit (admin only)
    get: (fruitId: number) => `${API_BASE_URL}/fruits/${fruitId}`,
    update: (fruitId: number) => `${API_BASE_URL}/fruits/${fruitId}`,  // PATCH
    delete: (fruitId: number) => `${API_BASE_URL}/fruits/${fruitId}`,
  },
  
  // Recipes
  recipes: {
    list: `${API_BASE_URL}/recipes`,             // GET: List recipes (with optional fruit_id and is_active filter)
    listByFruit: (fruitId: number) => `${API_BASE_URL}/recipes?fruit_id=${fruitId}`,  // GET: List recipes by fruit_id
    create: `${API_BASE_URL}/recipes`,           // POST: Create recipe (admin only)
    get: (recipeId: number) => `${API_BASE_URL}/recipes/${recipeId}`,  // Returns recipe with phases and policies
    update: (recipeId: number) => `${API_BASE_URL}/recipes/${recipeId}`,  // PATCH
    delete: (recipeId: number) => `${API_BASE_URL}/recipes/${recipeId}`,
  },
  
  // Phases (sub-resource of recipes)
  phases: {
    create: (recipeId: number) => `${API_BASE_URL}/recipes/${recipeId}/phases`,  // POST
    update: (recipeId: number, phaseId: number) => `${API_BASE_URL}/recipes/${recipeId}/phases/${phaseId}`,  // PATCH
    delete: (recipeId: number, phaseId: number) => `${API_BASE_URL}/recipes/${recipeId}/phases/${phaseId}`,
  },
  
  // Policies (sub-resource of recipes)
  policies: {
    create: (recipeId: number) => `${API_BASE_URL}/recipes/${recipeId}/policies`,  // POST
    update: (recipeId: number, policyId: number) => `${API_BASE_URL}/recipes/${recipeId}/policies/${policyId}`,  // PATCH
    delete: (recipeId: number, policyId: number) => `${API_BASE_URL}/recipes/${recipeId}/policies/${policyId}`,
  },
};

// ============================================================================
// BATCH APIs
// ============================================================================
export const BATCH_ENDPOINTS = {
  create: `${API_BASE_URL}/batches`,             // POST: Create new batch
  list: `${API_BASE_URL}/batches`,               // GET: List batches (with optional filters)
  get: (batchId: number) => `${API_BASE_URL}/batches/${batchId}`,
  update: (batchId: number) => `${API_BASE_URL}/batches/${batchId}`,  // PATCH: Update batch
  start: (batchId: number) => `${API_BASE_URL}/batches/${batchId}/start`,  // POST: Start batch
  pause: (batchId: number) => `${API_BASE_URL}/batches/${batchId}/stop`,  // POST: Pause batch
  
  // Sensor data for batches
  sensorData: (batchId: number) => `${API_BASE_URL}/batches/${batchId}/sensor-data`,  // GET: Get sensor data for batch
  ingestSensorData: (batchId: number) => `${API_BASE_URL}/batches/${batchId}/ingest-sensor-data`,  // POST: Ingest sensor data
};

// ============================================================================
// MONITORING APIs (Logs, Dashboard, Reports)
// ============================================================================
export const MONITORING_ENDPOINTS = {
  // Logs
  logs: `${API_BASE_URL}/logs`,                  // GET: Get logs with optional filters (batch_id, dry_id, log_style, from, to)
  auditLogs: `${API_BASE_URL}/logs/audit`,       // GET: Get audit logs (admin only)
  
  // Dashboard
  dashboard: {
    overview: `${API_BASE_URL}/dashboard/overview`,  // GET: Get dashboard overview (with optional from/to filters)
  },
  
  // Charts
  charts: {
    temperatureHumidity: `${API_BASE_URL}/dashboard/charts/temperature-humidity`,  // GET: Get temp/humidity chart data with batch_id param
  },
  
  // Reports
  reports: {
    operations: `${API_BASE_URL}/reports/operations`,  // GET: Get operations report for batch
    export: `${API_BASE_URL}/reports/export`,  // POST: Export reports
  },
};

// ============================================================================
// Query Parameters Helper
// ============================================================================
export const createQueryParams = (params: Record<string, any>): string => {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return filtered ? `?${filtered}` : '';
};

// ============================================================================
// API Request Helper
// ============================================================================
export const apiRequest = async (
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: Record<string, any>,
  headers?: Record<string, string>
) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };
  
  if (data && (method === 'POST' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  } 
  
  const response = await fetch(endpoint, config);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('userData');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  
  return response.json();
};

// ============================================================================
// Specific API Call Wrappers
// ============================================================================

// Auth
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('POST', AUTH_ENDPOINTS.login, { email, password });
    // Lưu token từ response vào localStorage
    if (response.access_token && typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.access_token);
    }
    // Lưu user info nếu có
    if (response.user && typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify(response.user));
    }
    return response;
  },
  
  logout: () =>
    apiRequest('POST', AUTH_ENDPOINTS.logout),
  
  getCurrentUser: async () => {
    const response = await apiRequest('GET', AUTH_ENDPOINTS.me);
    // Lưu user info vào localStorage để restore khi refresh
    if (response.data && typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify(response.data));
    } else if (response && typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify(response));
    }
    return response;
  },
};

// Users
export const userAPI = {
  list: (filters?: { email?: string; is_admin?: boolean; is_active?: boolean }) =>
    apiRequest('GET', `${USER_ENDPOINTS.list}${createQueryParams(filters || {})}`),
  
  create: (userData: { app_user_name: string; email: string; password: string; is_admin?: boolean }) =>
    apiRequest('POST', USER_ENDPOINTS.create, userData),
  
  update: (userId: number, data: Record<string, any>) =>
    apiRequest('PATCH', USER_ENDPOINTS.update(userId), data),
  
  delete: (userId: number) =>
    apiRequest('DELETE', USER_ENDPOINTS.delete(userId)),
  
  updateScope: (userId: number, scopes: any[]) =>
    apiRequest('PATCH', USER_ENDPOINTS.updateScope(userId), { scopes }),
  
  listScopes: (userId: number) =>
    apiRequest('GET', USER_ENDPOINTS.listScopes(userId)),
};

// Batches
export const batchAPI = {
  create: (batchData: {
    dry_id: number;
    fruit_id: number;
    recipe_id: number;
    operation_mode: 'manual' | 'scheduled';
    threshold_enabled?: boolean;
    is_customize?: boolean;
  }) =>
    apiRequest('POST', BATCH_ENDPOINTS.create, batchData),
  
  list: (filters?: { dry_id?: number; status?: string; from?: string; to?: string }) =>
    apiRequest('GET', `${BATCH_ENDPOINTS.list}${createQueryParams(filters || {})}`),
  
  get: (batchId: number) =>
    apiRequest('GET', BATCH_ENDPOINTS.get(batchId)),
  
  update: (batchId: number, data: Record<string, any>) =>
    apiRequest('PATCH', BATCH_ENDPOINTS.update(batchId), data),
  
  start: (batchId: number) =>
    apiRequest('POST', BATCH_ENDPOINTS.start(batchId)),
  
  pause: (batchId: number, final_status: string) =>
    apiRequest('POST', BATCH_ENDPOINTS.pause(batchId), { final_status : final_status }),
  
};

// Catalog
export const catalogAPI = {
  fruits: {
    list: () =>
      apiRequest('GET', CATALOG_ENDPOINTS.fruits.list),
    
    create: (fruitName: string) =>
      apiRequest('POST', CATALOG_ENDPOINTS.fruits.create, { fruit_name: fruitName }),
  },
  
  recipes: {
    list: (filters?: { fruit_id?: number; is_active?: boolean }) =>
      apiRequest('GET', `${CATALOG_ENDPOINTS.recipes.list}${createQueryParams(filters || {})}`),
    
    get: (recipeId: number) =>
      apiRequest('GET', CATALOG_ENDPOINTS.recipes.get(recipeId)),
    
    create: (recipeData: any) =>
      apiRequest('POST', CATALOG_ENDPOINTS.recipes.create, recipeData),
    
    update: (recipeId: number, data: Record<string, any>) =>
      apiRequest('PATCH', CATALOG_ENDPOINTS.recipes.update(recipeId), data),
  },
};

// Factory Structure
export const structureAPI = {
  factories: {
    list: () =>
      apiRequest('GET', FACTORY_ENDPOINTS.factories.list),
  },
  
  areas: {
    list: (filters?: { fac_id?: number }) =>
      apiRequest('GET', `${FACTORY_ENDPOINTS.areas.list}${createQueryParams(filters || {})}`),
  },
  
  dryers: {
    list: (filters?: { area_id?: number; status?: string }) =>
      apiRequest('GET', `${FACTORY_ENDPOINTS.dryers.list}${createQueryParams(filters || {})}`),
    
    get: (dryerId: number) =>
      apiRequest('GET', FACTORY_ENDPOINTS.dryers.get(dryerId))
  },
  
  sensors: {
    list: (filters?: { dry_id?: number; sensor_type?: string }) =>
      apiRequest('GET', `${FACTORY_ENDPOINTS.sensors.list}${createQueryParams(filters || {})}`),
    
    get: (sensorId: number) =>
      apiRequest('GET', FACTORY_ENDPOINTS.sensors.get(sensorId)),
    
    getData: (sensorId: number, filters?: { from?: string; to?: string; limit?: number }) =>
      apiRequest('GET', `${FACTORY_ENDPOINTS.sensors.data(sensorId)}${createQueryParams(filters || {})}`),
    update: (sensorId: number, value: number) =>
      apiRequest('POST', FACTORY_ENDPOINTS.sensors.update, { sensor_id: sensorId, value }),

  },
  
  controls: {
    list: (filters?: { dry_id?: number; control_type?: string }) =>
      apiRequest('GET', `${FACTORY_ENDPOINTS.controls.list}${createQueryParams(filters || {})}`),

    create: (data: Record<string, any>) =>
      apiRequest('POST', FACTORY_ENDPOINTS.controls.create, data),
    
    get: (controlId: number) =>
      apiRequest('GET', FACTORY_ENDPOINTS.controls.get(controlId)),
    
    update: (controlId: number, data: Record<string, any>) =>
      apiRequest('PATCH', FACTORY_ENDPOINTS.controls.update(controlId), data),

    execute: (controlId: number, value: any) =>
      apiRequest('POST', FACTORY_ENDPOINTS.controls.execute(controlId), { value }),
  },
};

// Monitoring
export const monitoringAPI = {
  logs: {
    list: (filters?: { batch_id?: number; dry_id?: number; app_user_id?: number }) =>
      apiRequest('GET', `${MONITORING_ENDPOINTS.logs}${createQueryParams(filters || {})}`),
    
    audit: () =>
      apiRequest('GET', MONITORING_ENDPOINTS.auditLogs),
  },
  
  dashboard: {
    overview: (filters?: { from?: string; to?: string }) =>
      apiRequest('GET', `${MONITORING_ENDPOINTS.dashboard.overview}${createQueryParams(filters || {})}`),
  },
  
  charts: {
    temperatureHumidity: (params: { batchId?: number; dryId?: number } | number) => {
      // Support both old signature (batchId as number) and new signature (params object)
      const queryParams = typeof params === 'number' 
        ? { batch_id: params }
        : {
            ...(params.batchId && { batch_id: params.batchId }),
            ...(params.dryId && { dry_id: params.dryId }),
          };
      return apiRequest('GET', `${MONITORING_ENDPOINTS.charts.temperatureHumidity}${createQueryParams(queryParams)}`);
    },
  },
  
  reports: { 
    operations: () =>
      apiRequest('GET', MONITORING_ENDPOINTS.reports.operations),
    
    export: (data?: { batch_id?: number; dry_id?: number; format?: string }) =>
      apiRequest('POST', MONITORING_ENDPOINTS.reports.export, data || {}),
  },
};

// Export all
export default {
  AUTH_ENDPOINTS,
  USER_ENDPOINTS,
  FACTORY_ENDPOINTS,
  CATALOG_ENDPOINTS,
  BATCH_ENDPOINTS,
  MONITORING_ENDPOINTS,
  authAPI,
  userAPI,
  batchAPI,
  catalogAPI,
  structureAPI,
  monitoringAPI,
  apiRequest,
  createQueryParams,
};
