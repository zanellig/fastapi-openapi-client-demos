import type { DispatchStatus } from '../api/generated';

export const formatStatus = (status: DispatchStatus) =>
  status.replace('_', ' ');

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const nextStatusLabel = (status: DispatchStatus) => {
  if (status === 'queued') {
    return 'Mark in transit';
  }
  if (status === 'in_transit') {
    return 'Mark delivered';
  }
  return null;
};
