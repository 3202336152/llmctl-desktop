/**
 * MCP 配置管理工具
 * 用于在跨平台场景下写入 MCP 配置文件到本地
 *
 * @author Liu Yifan
 * @version 2.2.2
 * @since 2025-11-03
 */

import { sessionAPI } from '../services/sessionAPI';

// 检测是否为开发环境（Webpack 构建时注入）
const isDev = process.env.NODE_ENV === 'development';

/**
 * 条件日志：开发环境记录 INFO，生产环境只记录 ERROR
 */
const logInfo = (...args: any[]) => {
  if (isDev) {
    window.electronAPI.logInfo(...args);
  }
};

const logWarn = (...args: any[]) => {
  if (isDev) {
    window.electronAPI.logWarn(...args);
  }
};

/**
 * 获取 MCP 配置文件名
 *
 * MCP 服务器配置应该是项目级别的统一配置，与具体使用的 CLI 工具无关。
 * 所有 CLI 工具（claude code、codex、gemini、qoder）都应该读取同一个 .mcp.json 文件。
 *
 * @returns 配置文件路径（相对于工作目录）
 */
export const getConfigFileName = (): string => {
  return '.mcp.json';
};

/**
 * 写入 MCP 配置到本地文件（跨平台兼容）
 *
 * 工作流程：
 * 1. 调用后端接口获取 MCP 配置内容
 * 2. 统一写入项目根目录的 .mcp.json 文件
 * 3. 使用 Electron IPC 写入本地文件
 *
 * 日志策略：
 * - 开发环境：记录所有 INFO/WARN/ERROR 日志
 * - 生产环境：仅记录 ERROR 日志
 *
 * @param sessionId 会话 ID
 * @param workingDirectory 工作目录
 * @returns Promise<boolean> 是否成功写入
 */
export const writeMcpConfig = async (
  sessionId: string,
  workingDirectory: string
): Promise<boolean> => {
  // ✅ 条件日志：开发环境详细记录，生产环境静默
  logInfo('[MCP] 🔄 开始写入配置...');
  logInfo('[MCP]   会话 ID:', sessionId);
  logInfo('[MCP]   工作目录:', workingDirectory);
  logInfo('[MCP]   操作系统:', navigator.platform);
  logInfo('[MCP]   用户代理:', navigator.userAgent);

  try {
    // 1. 获取 MCP 配置内容
    logInfo('[MCP] 📡 调用后端接口获取配置内容...');
    const mcpResponse = await sessionAPI.getMcpConfig(sessionId);

    if (!mcpResponse.data) {
      logWarn('[MCP] ⚠️ 后端返回空数据，会话', sessionId);
      return false;
    }

    const serverCount = Object.keys(mcpResponse.data.mcpServers || {}).length;
    logInfo('[MCP] 📦 获取到', serverCount, '个 MCP 服务器配置');

    if (serverCount === 0) {
      logInfo('[MCP] ℹ️ 无需写入 MCP 配置（无服务器）');
      return false;
    }

    // 2. 统一使用 .mcp.json 配置文件
    const configFileName = getConfigFileName();
    const configPath = `${workingDirectory}/${configFileName}`;
    const configContent = JSON.stringify(mcpResponse.data, null, 2);

    logInfo('[MCP] 📝 准备写入配置文件:');
    logInfo('[MCP]   目标路径:', configPath);
    logInfo('[MCP]   文件大小:', configContent.length, '字节');
    logInfo('[MCP]   配置内容预览:', configContent.substring(0, 100) + '...');

    // 3. 写入本地文件
    logInfo('[MCP] 💾 调用 Electron IPC 写入文件...');
    const success = await window.electronAPI.writeFile(configPath, configContent);

    if (success) {
      logInfo('[MCP] ✅ 配置文件写入成功！');
      logInfo('[MCP]   文件路径:', configPath);
      logInfo('[MCP]   服务器数量:', serverCount);
      return true;
    } else {
      // ❌ 写入失败始终记录错误（生产环境也记录）
      window.electronAPI.logError('[MCP] ❌ 配置文件写入失败！');
      window.electronAPI.logError('[MCP]   文件路径:', configPath);
      window.electronAPI.logError('[MCP]   可能原因：权限不足、磁盘空间不足、路径不存在');
      return false;
    }
  } catch (error) {
    // ❌ 异常始终记录错误（生产环境也记录）
    window.electronAPI.logError('[MCP] ❌ 写入配置文件异常！');
    window.electronAPI.logError('[MCP]   会话 ID:', sessionId);
    window.electronAPI.logError('[MCP]   工作目录:', workingDirectory);
    window.electronAPI.logError('[MCP]   错误详情:', error);

    // 详细的错误堆栈
    if (error instanceof Error) {
      window.electronAPI.logError('[MCP]   错误消息:', error.message);
      window.electronAPI.logError('[MCP]   错误堆栈:', error.stack);
    }

    return false;
  }
};
