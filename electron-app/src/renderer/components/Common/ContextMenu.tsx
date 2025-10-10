import React, { useEffect, useState } from 'react';
import { Dropdown, Menu, MenuProps } from 'antd';

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  children?: ContextMenuItem[];
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  onSelect: (key: string) => void;
  children: React.ReactElement;
}

/**
 * 右键上下文菜单组件
 * 包装子元素，提供右键菜单功能
 */
const ContextMenu: React.FC<ContextMenuProps> = ({ items, onSelect, children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 转换菜单项格式
  const convertMenuItems = (menuItems: ContextMenuItem[]): any => {
    return menuItems.map(item => {
      if (item.divider) {
        return { type: 'divider' as const, key: item.key };
      }

      return {
        key: item.key,
        label: item.label,
        icon: item.icon,
        danger: item.danger,
        disabled: item.disabled,
        children: item.children ? convertMenuItems(item.children) : undefined,
      };
    });
  };

  const menuProps: any = {
    items: convertMenuItems(items),
    onClick: ({ key }: { key: string }) => {
      onSelect(key);
      setVisible(false);
    },
  };

  // 阻止默认右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setVisible(true);
  };

  // 点击其他地方关闭菜单
  useEffect(() => {
    const handleClick = () => setVisible(false);
    if (visible) {
      document.addEventListener('click', handleClick);
    }
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [visible]);

  return (
    <>
      {React.cloneElement(children, {
        onContextMenu: handleContextMenu,
      })}
      {visible && (
        <div
          style={{
            position: 'fixed',
            top: position.y,
            left: position.x,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #f0f0f0',
            }}
          >
            <Menu {...menuProps} style={{ border: 'none' }} />
          </div>
        </div>
      )}
    </>
  );
};

export default ContextMenu;
