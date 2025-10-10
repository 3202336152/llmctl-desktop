/**
 * Ant Design 主题配置 - 亮色主题
 * 清爽明亮的桌面应用风格
 */

export const lightTheme = {
  token: {
    // 颜色主题
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // 背景
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // 字体
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,

    // 间距
    marginXS: 4,
    marginSM: 8,
    margin: 12,
    marginMD: 16,
    marginLG: 20,
    marginXL: 24,
    marginXXL: 32,

    // 高度
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.12)',
  },

  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
      siderBg: '#ffffff',
    },

    Button: {
      primaryShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
      dangerShadow: '0 2px 4px rgba(255, 77, 79, 0.2)',
    },

    Card: {
      colorBgContainer: '#ffffff',
      colorBorderSecondary: '#f0f0f0',
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },

    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
      borderColor: '#f0f0f0',
    },

    Input: {
      activeBorderColor: '#1890ff',
      hoverBorderColor: '#40a9ff',
    },

    Select: {
      optionSelectedBg: '#e6f7ff',
    },

    Tabs: {
      itemHoverColor: '#1890ff',
      itemSelectedColor: '#1890ff',
    },
  },
};
