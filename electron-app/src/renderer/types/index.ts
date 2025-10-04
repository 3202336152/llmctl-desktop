// API Response 类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  error?: string;
}

// Provider 相关类型
export interface Provider {
  id: string;
  name: string;
  description?: string;
  type: 'anthropic' | 'openai' | 'qwen' | 'gemini';
  baseUrl: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tokens?: Token[];
  tokenStrategy?: TokenStrategy;
}

export interface CreateProviderRequest {
  name: string;
  description?: string;
  type: string;
  baseUrl?: string;
  modelName?: string;
  token: string;
  maxTokens?: number;
  temperature?: number;
}

export interface UpdateProviderRequest {
  name?: string;
  description?: string;
  baseUrl?: string;
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
  isActive?: boolean;
}

// Token 相关类型
export interface Token {
  id: string;
  providerId: string;
  alias?: string;
  maskedValue: string;
  weight: number;
  enabled: boolean;
  healthy: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTokenRequest {
  value: string;
  alias?: string;
  weight?: number;
  enabled?: boolean;
}

export interface UpdateTokenRequest {
  alias?: string;
  weight?: number;
  enabled?: boolean;
  healthy?: boolean;
}

export interface TokenStrategy {
  type: 'round-robin' | 'weighted' | 'random' | 'least-used';
  fallbackOnError: boolean;
}

// Session 相关类型
export interface Session {
  id: string;
  providerId: string;
  providerName?: string;
  tokenId?: string;
  pid?: number;
  workingDirectory: string;
  command: string;
  status: 'active' | 'inactive' | 'terminated';
  startTime: string;
  endTime?: string;
  lastActivity?: string;
}

export interface StartSessionRequest {
  providerId: string;
  workingDirectory: string;
  command?: string;
}

export interface UpdateSessionStatusRequest {
  status: 'active' | 'inactive' | 'terminated';
}

// Configuration 相关类型
export interface GlobalConfig {
  configKey: string;
  configValue: string;
  description?: string;
}

export interface ConfigExportResponse {
  format: 'bash' | 'powershell' | 'cmd' | 'json';
  content: string;
}

export interface ConfigImportRequest {
  format: 'json' | 'env' | 'yaml';
  data: string;  // JSON字符串
  overwrite?: boolean;
}

export interface ConfigValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Statistics 相关类型
export interface UsageStatistics {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  dailyStats: DailyStatistics[];
}

export interface DailyStatistics {
  date: string;
  requests: number;
  successes: number;
  errors: number;
}

// Provider Template 相关类型
export interface ProviderTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  defaultBaseUrl?: string;
  defaultModelName?: string;
  envVarsTemplate?: Record<string, any>;
  setupPrompts?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: string;
  defaultBaseUrl?: string;
  defaultModelName?: string;
  envVarsTemplate?: Record<string, any>;
  setupPrompts?: Record<string, any>;
  isActive?: boolean;
}

export interface ProviderConfigFromTemplate {
  name?: string;
  description?: string;
  type: string;
  baseUrl?: string;
  modelName?: string;
  token?: string;
  environmentVariables?: Record<string, string>;
}

// UI State 类型
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}