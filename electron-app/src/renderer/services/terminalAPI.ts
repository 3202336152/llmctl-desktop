import apiClient from './httpClient';

export const terminalAPI = {
  /**
   * 连接SSE流接收输出
   */
  connectOutput: (
    sessionId: string,
    onOutput: (data: string) => void,
    onError?: (error: Event) => void
  ): EventSource => {
    const eventSource = new EventSource(
      `http://localhost:8080/llmctl/sessions/${sessionId}/output`
    );

    // 监听连接事件
    eventSource.addEventListener('connect', (event) => {
      console.log('SSE连接建立:', event.data);
    });

    // 监听输出事件
    eventSource.addEventListener('output', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'output' && data.data) {
          onOutput(data.data);
        }
      } catch (error) {
        console.error('解析SSE数据失败:', error);
      }
    });

    // 监听终止事件
    eventSource.addEventListener('terminate', () => {
      console.log('会话已终止');
      eventSource.close();
    });

    // 错误处理
    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      if (onError) {
        onError(error);
      }
    };

    return eventSource;
  },

  /**
   * 发送用户输入到会话
   */
  sendInput: async (sessionId: string, input: string): Promise<void> => {
    await apiClient.post(`/sessions/${sessionId}/input`, { input });
  },
};

export default terminalAPI;