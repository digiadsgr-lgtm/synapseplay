import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getActivityById } from '../data/activitiesCatalog';
import { ActivityRunner } from '../components/ActivityRunner';
import { ActivityDispatcher } from '../activities/ActivityDispatcher';

export const ActivityPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const activity = activityId ? getActivityById(activityId) : undefined;

  if (!activity) {
    return <Navigate to="/app" replace />;
  }

  return (
    <ActivityRunner activity={activity}>
      {(runnerProps) => (
        <ActivityDispatcher activityId={activity.id} runnerProps={runnerProps} />
      )}
    </ActivityRunner>
  );
};
