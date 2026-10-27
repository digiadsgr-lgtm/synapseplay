import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getActivityById } from '../data/activitiesCatalog';
import { ActivityRunner } from '../components/ActivityRunner';
import { ActivityDispatcher } from '../activities/ActivityDispatcher';
import { AccessLockedScreen } from '../components/AccessLockedScreen';
import { useApp } from '../context/AppContext';

export const ActivityPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const activity = activityId ? getActivityById(activityId) : undefined;
  const { licenseState } = useApp();

  if (!activity) {
    return <Navigate to="/app" replace />;
  }

  // Payments ON + trial over + no licence → games locked (data kept)
  if (licenseState.isAccessLocked) {
    return <AccessLockedScreen />;
  }

  return (
    <ActivityRunner key={activity.id} activity={activity}>
      {(runnerProps) => (
        <ActivityDispatcher activityId={activity.id} runnerProps={runnerProps} />
      )}
    </ActivityRunner>
  );
};
