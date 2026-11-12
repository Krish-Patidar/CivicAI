import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { CATEGORY_LABELS, getImageUrl, timeAgo } from '../../utils/helpers';
import { MapPin, Clock, Building2, Tag, AlertCircle, CheckCircle, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';
import ReviewNotice from './ReviewNotice';

const StatusBadge = ({ status, needsReview }) => {
  const config = {
    pending: { icon: AlertCircle, class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    in_progress: { icon: RefreshCw, class: 'bg-primary-500/10 text-primary-400 border-primary-500/20' },
    completed: { icon: CheckCircle, class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    rejected: { icon: XCircle, class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    under_review: { icon: AlertTriangle, class: 'bg-orange-500/10 text-orange-300 border-orange-500/30' }
  };

  const key = needsReview && status !== 'rejected' ? 'under_review' : status;
  const current = config[key] || config.pending;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${current.class}`}>
      <Icon className="w-3.5 h-3.5" />
      {key?.replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[priority] || colors.medium}`}>
      {priority}
    </span>
  );
};

const ComplaintCard = ({ complaint, onClick, children }) => {
  const imageUrl = getImageUrl(complaint.image);

  return (
    <GlassCard 
      className="!p-5 cursor-pointer hover:border-primary-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300 group"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row gap-5">
        {imageUrl && (
          <div className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 relative">
            <img src={imageUrl} alt="complaint" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent sm:hidden" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-primary-400 transition-colors line-clamp-1">{complaint.title}</h3>
                <p className="text-xs font-mono text-gray-500 mt-1">{complaint.complaintNumber}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={complaint.status} needsReview={complaint.needsReview} />
                <PriorityBadge priority={complaint.priority} />
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-3 line-clamp-2 leading-relaxed">{complaint.description}</p>
            <p className="text-sm text-gray-400 mt-3 line-clamp-2 leading-relaxed">{complaint.description}</p>
            <ReviewNotice complaint={complaint} compact className="mt-3" />
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 pt-4 border-t border-white/5 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
              <Tag className="w-3.5 h-3.5" />
              {complaint.needsReview && complaint.status !== 'rejected'
                ? 'Under Review'
                : (CATEGORY_LABELS[complaint.category] || complaint.category)}
            </span>
            {complaint.location?.address && (
              <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={complaint.location.address}>
                <MapPin className="w-3.5 h-3.5 text-primary-400" />
                <span className="truncate">{complaint.location.address}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 ml-auto">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(complaint.createdAt)}
            </span>
            {complaint.departmentId?.name && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                {complaint.departmentId.name}
              </span>
            )}
          </div>

          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </GlassCard>
  );
};

export { StatusBadge, PriorityBadge };
export default ComplaintCard;
