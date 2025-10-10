import React, { useState } from 'react';
import { Table, TableProps, Space, Tooltip, Button, Dropdown, MenuProps } from 'antd';
import {
  ColumnHeightOutlined,
  MenuOutlined,
} from '@ant-design/icons';

export type TableDensity = 'compact' | 'standard' | 'comfortable';

interface DensityTableProps<T> extends Omit<any, 'size'> {
  defaultDensity?: TableDensity;
  showDensityToggle?: boolean;
}

/**
 * 支持密度切换的增强表格组件
 * 可在紧凑/标准/舒适三种密度间切换
 */
function DensityTable<T extends object = any>({
  defaultDensity = 'standard',
  showDensityToggle = true,
  ...tableProps
}: DensityTableProps<T>) {
  const [density, setDensity] = useState<TableDensity>(defaultDensity);

  const densityConfig = {
    compact: {
      size: 'small' as const,
      label: '紧凑',
      cellPadding: '4px 8px',
    },
    standard: {
      size: 'middle' as const,
      label: '标准',
      cellPadding: '8px 12px',
    },
    comfortable: {
      size: 'large' as const,
      label: '舒适',
      cellPadding: '12px 16px',
    },
  };

  const densityMenuItems: any = [
    {
      key: 'compact',
      label: (
        <Space>
          <ColumnHeightOutlined />
          紧凑
        </Space>
      ),
      onClick: () => setDensity('compact'),
    },
    {
      key: 'standard',
      label: (
        <Space>
          <ColumnHeightOutlined />
          标准
        </Space>
      ),
      onClick: () => setDensity('standard'),
    },
    {
      key: 'comfortable',
      label: (
        <Space>
          <ColumnHeightOutlined />
          舒适
        </Space>
      ),
      onClick: () => setDensity('comfortable'),
    },
  ];

  const currentConfig = densityConfig[density];

  return (
    <div>
      {showDensityToggle && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Dropdown menu={{ items: densityMenuItems }} placement="bottomRight">
            <Tooltip title="调整密度">
              <Button
                icon={<ColumnHeightOutlined />}
                size="small"
              >
                密度: {currentConfig.label}
              </Button>
            </Tooltip>
          </Dropdown>
        </div>
      )}
      <Table<T>
        {...tableProps}
        size={currentConfig.size}
        style={{
          ...tableProps.style,
        }}
        className={`density-table density-${density} ${tableProps.className || ''}`}
      />
      <style>{`
        .density-table.density-compact .ant-table-cell {
          padding: ${densityConfig.compact.cellPadding} !important;
        }
        .density-table.density-standard .ant-table-cell {
          padding: ${densityConfig.standard.cellPadding} !important;
        }
        .density-table.density-comfortable .ant-table-cell {
          padding: ${densityConfig.comfortable.cellPadding} !important;
        }
      `}</style>
    </div>
  );
}

export default DensityTable;
