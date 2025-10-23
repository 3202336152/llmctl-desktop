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
    colorBgSpotlight: '#262626',
    colorBgMask: 'rgba(0, 0, 0, 0.65)',

    // 文字颜色
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',
    colorTextDisabled: 'rgba(255, 255, 255, 0.25)',
    colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',

    // 边框
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',

    // 填充色
    colorFill: 'rgba(255, 255, 255, 0.08)',
    colorFillSecondary: 'rgba(255, 255, 255, 0.06)',
    colorFillTertiary: 'rgba(255, 255, 255, 0.04)',
    colorFillQuaternary: 'rgba(255, 255, 255, 0.02)',

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
      triggerBg: '#262626',
      triggerColor: 'rgba(255, 255, 255, 0.85)',
    },

    Button: {
      primaryShadow: '0 2px 4px rgba(23, 125, 220, 0.3)',
      dangerShadow: '0 2px 4px rgba(211, 32, 41, 0.3)',
      defaultBg: '#262626',
      defaultBorderColor: '#434343',
      defaultColor: 'rgba(255, 255, 255, 0.85)',
      defaultHoverBg: '#303030',
      defaultHoverBorderColor: '#177ddc',
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
      colorBgContainer: '#1f1f1f',
    },

    Input: {
      activeBorderColor: '#177ddc',
      hoverBorderColor: '#3c9ae8',
      colorBgContainer: '#1f1f1f',
      colorText: 'rgba(255, 255, 255, 0.85)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',
      colorBorder: '#434343',
    },

    Select: {
      optionSelectedBg: '#111b26',
      colorBgContainer: '#1f1f1f',
      colorBgElevated: '#262626',
      colorText: 'rgba(255, 255, 255, 0.85)',
      colorBorder: '#434343',
    },

    Tabs: {
      itemHoverColor: '#177ddc',
      itemSelectedColor: '#177ddc',
      itemColor: 'rgba(255, 255, 255, 0.65)',
      cardBg: '#1f1f1f',
    },

    Modal: {
      contentBg: '#1f1f1f',
      headerBg: '#1f1f1f',
      titleColor: 'rgba(255, 255, 255, 0.85)',
    },

    Dropdown: {
      colorBgElevated: '#262626',
      colorText: 'rgba(255, 255, 255, 0.85)',
    },

    Menu: {
      itemBg: '#1f1f1f',
      itemSelectedBg: '#111b26',
      itemHoverBg: '#262626',
      itemColor: 'rgba(255, 255, 255, 0.65)',
      itemSelectedColor: '#177ddc',
    },

    Form: {
      labelColor: 'rgba(255, 255, 255, 0.85)',
    },

    Checkbox: {
      colorBgContainer: '#1f1f1f',
      colorBorder: '#434343',
    },

    Radio: {
      colorBgContainer: '#1f1f1f',
      colorBorder: '#434343',
    },

    Switch: {
      colorTextQuaternary: '#434343',
      colorTextTertiary: 'rgba(255, 255, 255, 0.65)',
    },

    Tag: {
      defaultBg: '#262626',
      defaultColor: 'rgba(255, 255, 255, 0.85)',
    },

    Badge: {
      textFontSize: 12,
      textFontWeight: 'normal',
    },

    Tooltip: {
      colorBgSpotlight: '#262626',
      colorTextLightSolid: 'rgba(255, 255, 255, 0.85)',
    },

    Popover: {
      colorBgElevated: '#262626',
      colorText: 'rgba(255, 255, 255, 0.85)',
    },

    Message: {
      contentBg: '#262626',
      contentPadding: '10px 16px',
    },

    Notification: {
      colorBgElevated: '#262626',
      colorText: 'rgba(255, 255, 255, 0.85)',
    },

    Progress: {
      defaultColor: '#177ddc',
      remainingColor: 'rgba(255, 255, 255, 0.15)',
    },

    Spin: {
      colorPrimary: '#177ddc',
    },

    DatePicker: {
      colorBgContainer: '#1f1f1f',
      colorBgElevated: '#262626',
      colorText: 'rgba(255, 255, 255, 0.85)',
      colorBorder: '#434343',
    },

    TimePicker: {
      colorBgContainer: '#1f1f1f',
      colorBgElevated: '#262626',
      colorText: 'rgba(255, 255, 255, 0.85)',
      colorBorder: '#434343',
    },

    Pagination: {
      itemBg: '#1f1f1f',
      itemActiveBg: '#177ddc',
      itemLinkBg: '#1f1f1f',
      colorText: 'rgba(255, 255, 255, 0.65)',
      colorBorder: '#434343',
    },

    Divider: {
      colorSplit: '#303030',
    },

    Steps: {
      colorText: 'rgba(255, 255, 255, 0.65)',
      colorTextDescription: 'rgba(255, 255, 255, 0.45)',
    },

    Breadcrumb: {
      itemColor: 'rgba(255, 255, 255, 0.65)',
      lastItemColor: 'rgba(255, 255, 255, 0.85)',
      linkColor: 'rgba(255, 255, 255, 0.65)',
      linkHoverColor: '#177ddc',
      separatorColor: 'rgba(255, 255, 255, 0.45)',
    },

    Alert: {
      colorInfoBg: '#111b26',
      colorInfoBorder: '#15395b',
      colorSuccessBg: '#162312',
      colorSuccessBorder: '#274916',
      colorWarningBg: '#2b2111',
      colorWarningBorder: '#594214',
      colorErrorBg: '#2a1215',
      colorErrorBorder: '#58181c',
    },

    Drawer: {
      colorBgElevated: '#1f1f1f',
      colorText: 'rgba(255, 255, 255, 0.85)',
    },

    Collapse: {
      headerBg: '#262626',
      contentBg: '#1f1f1f',
      colorBorder: '#303030',
    },

    Cascader: {
      colorBgContainer: '#1f1f1f',
      colorBgElevated: '#262626',
      colorText: 'rgba(255, 255, 255, 0.85)',
      colorBorder: '#434343',
      optionSelectedBg: '#111b26',
    },

    Tree: {
      colorBgContainer: '#1f1f1f',
      nodeSelectedBg: '#111b26',
      nodeHoverBg: '#262626',
    },

    Transfer: {
      colorBgContainer: '#1f1f1f',
      colorBorder: '#434343',
      itemHoverBg: '#262626',
    },

    Skeleton: {
      colorFill: 'rgba(255, 255, 255, 0.08)',
      colorFillContent: 'rgba(255, 255, 255, 0.12)',
    },

    Segmented: {
      itemActiveBg: '#177ddc',
      itemColor: 'rgba(255, 255, 255, 0.65)',
      itemHoverBg: '#262626',
      trackBg: '#262626',
    },

    Rate: {
      colorFillContent: 'rgba(255, 255, 255, 0.12)',
    },

    Slider: {
      railBg: 'rgba(255, 255, 255, 0.15)',
      railHoverBg: 'rgba(255, 255, 255, 0.20)',
      trackBg: '#177ddc',
      trackHoverBg: '#3c9ae8',
    },

    Upload: {
      colorBorder: '#434343',
      colorBgContainer: '#1f1f1f',
      colorText: 'rgba(255, 255, 255, 0.85)',
    },

    Result: {
      colorTextHeading: 'rgba(255, 255, 255, 0.85)',
      colorTextDescription: 'rgba(255, 255, 255, 0.65)',
    },

    Empty: {
      colorText: 'rgba(255, 255, 255, 0.45)',
      colorTextDescription: 'rgba(255, 255, 255, 0.25)',
    },

    Statistic: {
      contentFontSize: 24,
      titleFontSize: 14,
    },

    Descriptions: {
      labelBg: '#262626',
      contentBg: '#1f1f1f',
      colorSplit: '#303030',
      colorText: 'rgba(255, 255, 255, 0.85)',
    },

    Timeline: {
      itemPaddingBottom: 20,
      tailColor: '#303030',
      dotBg: '#1f1f1f',
    },

    List: {
      colorBorder: '#303030',
      itemPadding: '12px 0',
    },
  },
};
