import React, { Component, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // 在Electron环境中显示错误通知
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification('应用错误', error.message);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="应用出现错误"
          subTitle={this.state.error?.message || '发生了未知错误'}
          extra={[
            <Button type="primary" key="reload" onClick={this.handleReload}>
              重新加载应用
            </Button>,
            <Button key="reset" onClick={this.handleReset}>
              重试
            </Button>,
          ]}
        >
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <div style={{ textAlign: 'left', marginTop: 16 }}>
              <details style={{ whiteSpace: 'pre-wrap' }}>
                <summary>错误详情（开发模式）</summary>
                {this.state.error && this.state.error.stack}
                <br />
                {this.state.errorInfo.componentStack}
              </details>
            </div>
          )}
        </Result>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;