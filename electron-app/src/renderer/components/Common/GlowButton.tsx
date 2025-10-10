import React, { CSSProperties } from 'react';
import { Button } from 'antd';

interface GlowButtonProps {
  glow?: boolean;
  glowColor?: 'primary' | 'success' | 'warning' | 'error';
  children?: React.ReactNode;
  style?: CSSProperties;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  [key: string]: any;
}

/**
 * 发光效果按钮组件
 * 支持渐变背景和发光动画
 */
const GlowButton: React.FC<GlowButtonProps> = ({
  glow = true,
  glowColor = 'primary',
  children,
  style,
  type = 'primary',
  ...rest
}) => {
  const glowColors = {
    primary: {
      gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      shadow: '0 0 20px rgba(24, 144, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)',
      hoverShadow: '0 0 30px rgba(24, 144, 255, 0.6), 0 8px 16px rgba(0, 0, 0, 0.2)',
    },
    success: {
      gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
      shadow: '0 0 20px rgba(82, 196, 26, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)',
      hoverShadow: '0 0 30px rgba(82, 196, 26, 0.6), 0 8px 16px rgba(0, 0, 0, 0.2)',
    },
    warning: {
      gradient: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
      shadow: '0 0 20px rgba(250, 173, 20, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)',
      hoverShadow: '0 0 30px rgba(250, 173, 20, 0.6), 0 8px 16px rgba(0, 0, 0, 0.2)',
    },
    error: {
      gradient: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
      shadow: '0 0 20px rgba(255, 77, 79, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)',
      hoverShadow: '0 0 30px rgba(255, 77, 79, 0.6), 0 8px 16px rgba(0, 0, 0, 0.2)',
    },
  };

  const glowStyle = glow && type === 'primary'
    ? {
        background: glowColors[glowColor].gradient,
        border: 'none',
        boxShadow: glowColors[glowColor].shadow,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(style || {}),
      }
    : (style || {});

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (glow && type === 'primary') {
      e.currentTarget.style.boxShadow = glowColors[glowColor].hoverShadow;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (glow && type === 'primary') {
      e.currentTarget.style.boxShadow = glowColors[glowColor].shadow;
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  return (
    <Button
      type={type}
      style={glowStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default GlowButton;
