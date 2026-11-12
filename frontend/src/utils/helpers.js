export const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000';

export const getImageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${UPLOAD_URL}${path}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const CATEGORY_LABELS = {
  road: 'Road', garbage: 'Garbage', water: 'Water',
  electricity: 'Electricity', sanitation: 'Sanitation',
  public_safety: 'Public Safety', parks: 'Parks', other: 'Other'
};

export const CATEGORY_COLORS = {
  road: '#ef4444', garbage: '#f59e0b', water: '#3b82f6',
  electricity: '#eab308', sanitation: '#8b5cf6', public_safety: '#ec4899',
  parks: '#10b981', other: '#6b7280'
};

export const STATUS_LABELS = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', rejected: 'Rejected'
};

export const PRIORITY_COLORS = { high: 'red', medium: 'orange', low: 'green' };

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};
