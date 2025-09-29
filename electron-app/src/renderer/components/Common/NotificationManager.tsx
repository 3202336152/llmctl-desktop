import React, { useEffect } from 'react';
import { notification } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store';
import { removeNotification } from '../../store/slices/uiSlice';
import type { RootState } from '../../store';

const NotificationManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state: RootState) => state.ui);

  useEffect(() => {
    notifications.forEach((notif) => {
      const notificationMethod = notification[notif.type as 'success' | 'info' | 'warning' | 'error'];
      if (notificationMethod) {
        notificationMethod({
          message: notif.title,
          description: notif.message,
          duration: notif.duration || 4.5,
          onClose: () => {
            dispatch(removeNotification(notif.id));
          },
        });
      }
    });
  }, [notifications, dispatch]);

  return null;
};

export default NotificationManager;