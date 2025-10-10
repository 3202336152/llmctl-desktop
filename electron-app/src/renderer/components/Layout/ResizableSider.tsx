import React, { useState, useRef, useEffect } from 'react';
import { Layout } from 'antd';

const { Sider } = Layout;

interface ResizableSiderProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapsed: boolean;
  onCollapse?: (collapsed: boolean) => void;
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 可调整宽度的侧边栏组件
 * 支持拖拽调整宽度
 */
const ResizableSider: React.FC<ResizableSiderProps> = ({
  children,
  defaultWidth = 240,
  minWidth = 200,
  maxWidth = 400,
  collapsed,
  onCollapse,
  theme = 'light',
  className = '',
  style = {},
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const siderRef = useRef<HTMLDivElement>(null);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // 处理拖拽
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return (
    <div
      ref={siderRef}
      style={{
        position: 'relative',
        width: collapsed ? 80 : width,
        transition: collapsed ? 'width 0.2s' : isResizing ? 'none' : 'width 0.2s',
        ...style,
      }}
      className={className}
    >
      <Sider
        theme={theme}
        width={collapsed ? 80 : width}
        collapsed={collapsed}
        onCollapse={onCollapse}
        trigger={null}
        style={{
          height: '100%',
          borderRight: '1px solid #f0f0f0',
          overflow: 'hidden',
          transition: collapsed ? 'all 0.2s' : isResizing ? 'none' : 'all 0.2s',
        }}
      >
        {children}
      </Sider>

      {/* 拖拽调整手柄 */}
      {!collapsed && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 4,
            cursor: 'col-resize',
            backgroundColor: isResizing ? '#1890ff' : 'transparent',
            transition: 'background-color 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1890ff';
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        />
      )}
    </div>
  );
};

export default ResizableSider;
