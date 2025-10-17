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

/**
 * Ant Design 主题配置 - 暗色主题
 * 舒适的暗色桌面应用风格
 */

export const darkTheme = {
  token: {
    // 颜色主题
    colorPrimary: '#177ddc',
    colorSuccess: '#49aa19',
    colorWarning: '#d89614',
    colorError: '#d32029',
    colorInfo: '#177ddc',

    // 背景
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#141414',

    // 文字颜色
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',

    // 边框
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',

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
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.55)',
  },

  components: {
    Layout: {
      headerBg: '#1f1f1f',
      bodyBg: '#141414',
      siderBg: '#1f1f1f',
    },

    Button: {
      primaryShadow: '0 2px 4px rgba(23, 125, 220, 0.3)',
      dangerShadow: '0 2px 4px rgba(211, 32, 41, 0.3)',
    },

    Card: {
      colorBgContainer: '#1f1f1f',
      colorBorderSecondary: '#303030',
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.45)',
    },

    Table: {
      headerBg: '#262626',
      rowHoverBg: '#262626',
      borderColor: '#303030',
    },

    Input: {
      activeBorderColor: '#177ddc',
      hoverBorderColor: '#3c9ae8',
      colorBgContainer: '#1f1f1f',
    },

    Select: {
      optionSelectedBg: '#111b26',
      colorBgContainer: '#1f1f1f',
    },

    Tabs: {
      itemHoverColor: '#177ddc',
      itemSelectedColor: '#177ddc',
    },

    Modal: {
      contentBg: '#1f1f1f',
      headerBg: '#1f1f1f',
    },

    Dropdown: {
      colorBgElevated: '#262626',
    },

    Menu: {
      itemBg: '#1f1f1f',
      itemSelectedBg: '#111b26',
      itemHoverBg: '#262626',
    },
  },
};
