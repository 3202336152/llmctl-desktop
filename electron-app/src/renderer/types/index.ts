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
  types: Array<'claude code' | 'codex' | 'gemini' | 'qoder'>;
  configs?: CliConfig[];
  extraHeaders?: string;
  tokenStrategy?: TokenStrategy;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tokens?: Token[];
}

export interface CliConfig {
  id: number;
  cliType: 'claude code' | 'codex' | 'gemini' | 'qoder';
  configData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderRequest {
  name: string;
  description?: string;
  types: string[];
  claudeConfig?: Record<string, any>;
  codexConfig?: Record<string, any>;
  geminiConfig?: Record<string, any>;
  qoderConfig?: Record<string, any>;
  extraHeaders?: string;
  tokenStrategyType?: string;
  tokenFallbackOnError?: boolean;
  token: string;  // API Token (必填)
  tokenAlias?: string;  // Token 别名 (可选)
}

export interface UpdateProviderRequest {
  name?: string;
  description?: string;
  types?: string[];
  claudeConfig?: Record<string, any>;
  codexConfig?: Record<string, any>;
  geminiConfig?: Record<string, any>;
  qoderConfig?: Record<string, any>;
  extraHeaders?: string;
  tokenStrategyType?: string;
  tokenFallbackOnError?: boolean;
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
  type?: 'claude code' | 'codex' | 'gemini' | 'qoder';
  status: 'active' | 'inactive' | 'terminated';
  startTime: string;
  endTime?: string;
  lastActivity?: string;
}

export interface StartSessionRequest {
  providerId: string;
  workingDirectory: string;
  command?: string;
  type?: 'claude code' | 'codex' | 'gemini' | 'qoder';
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
  format: 'bash' | 'powershell' | 'cmd' | 'json';
  data: string;  // 配置内容字符串
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


// UI State 类型
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}