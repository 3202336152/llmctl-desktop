import React from 'react';
import { Spin, Skeleton, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'default',
  tip = '加载中...',
  spinning = true,
  children
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  if (children) {
    return (
      <Spin spinning={spinning} tip={tip} indicator={antIcon}>
        {children}
      </Spin>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px'
    }}>
      <Spin size={size} tip={tip} indicator={antIcon} />
    </div>
  );
};

// 表格骨架屏组件
export const TableSkeleton: React.FC = () => (
  <Card>
    <Skeleton active paragraph={{ rows: 8 }} />
  </Card>
);

// 表单骨架屏组件
export const FormSkeleton: React.FC = () => (
  <Card>
    <Skeleton active paragraph={{ rows: 6 }} />
  </Card>
);

// 统计卡片骨架屏组件
export const StatSkeleton: React.FC = () => (
  <Card>
    <Skeleton active title={false} paragraph={{ rows: 2, width: ['60%', '40%'] }} />
  </Card>
);

export default Loading;