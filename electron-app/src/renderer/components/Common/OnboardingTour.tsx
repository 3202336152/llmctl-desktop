import React, { useState, useEffect } from 'react';
import { Tour } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * 新手引导组件
 * 首次登录时自动启动，引导用户了解核心功能
 */
const OnboardingTour: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 检查是否是首次访问
    const isFirstTime = !localStorage.getItem('onboarding-completed');
    if (isFirstTime) {
      // 延迟1秒启动，让页面完全加载
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('onboarding-completed', 'true');
  };

  const steps = [
    {
      title: t('onboarding.welcome', '欢迎使用 LLMctl'),
      description: t(
        'onboarding.welcomeDesc',
        '让我们快速了解系统的核心功能，帮助您快速上手'
      ),
      target: null,
    },
    {
      title: t('onboarding.step1', '第一步：配置 Provider'),
      description: t(
        'onboarding.step1Desc',
        '首先需要创建一个 LLM Provider（如 Claude、OpenAI、Gemini 等），Provider 是 CLI 工具的配置模板'
      ),
      target: () => document.querySelector('[data-tour="provider-menu"]') as HTMLElement,
    },
    {
      title: t('onboarding.step2', '第二步：添加 API Token'),
      description: t(
        'onboarding.step2Desc',
        '为 Provider 添加至少一个可用的 API Token，系统支持多Token轮询和健康检测'
      ),
      target: () => document.querySelector('[data-tour="token-menu"]') as HTMLElement,
    },
    {
      title: t('onboarding.step3', '第三步：创建会话'),
      description: t(
        'onboarding.step3Desc',
        '配置完成后，您可以启动一个会话。会话会自动选择健康的Token并启动CLI进程'
      ),
      target: () => document.querySelector('[data-tour="session-menu"]') as HTMLElement,
    },
    {
      title: t('onboarding.step4', '第四步：打开终端'),
      description: t(
        'onboarding.step4Desc',
        '在终端页面中，您可以与 AI 助手实时交互。支持多终端并发、快捷键操作等功能'
      ),
      target: () => document.querySelector('[data-tour="terminal-menu"]') as HTMLElement,
    },
    {
      title: t('onboarding.step5', '快速开始'),
      description: t(
        'onboarding.step5Desc',
        '您也可以直接点击控制台上的快速操作卡片，一键跳转到对应页面'
      ),
      target: () => document.querySelector('[data-tour="quick-create-session"]') as HTMLElement,
    },
  ];

  return (
    <Tour
      open={open}
      onClose={handleClose}
      steps={steps}
      indicatorsRender={(current: number, total: number) => (
        <span>
          {current + 1} / {total}
        </span>
      )}
    />
  );
};

export default OnboardingTour;
