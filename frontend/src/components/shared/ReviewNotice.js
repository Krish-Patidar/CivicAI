import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';

export default function ReviewNotice({ complaint, compact = false, className = '' }) {
  if (!complaint) return null;
  const size = compact ? 'text-xs p-2.5' : 'text-sm p-3';

  if (complaint.status === 'rejected') {
    return (
      <div className={`bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-200 flex items-start gap-2.5 ${size} ${className}`}>
        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 break-words">
          <strong className="text-rose-300">Rejected after review.</strong>{' '}
          {complaint.rejectionReason || 'This complaint did not pass the review.'}
        </div>
      </div>
    );
  }

  if (complaint.needsReview) {
    return (
      <div className={`bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 flex items-start gap-2.5 ${size} ${className}`}>
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 break-words">
          <strong className="text-amber-300">Under review.</strong>{' '}
          {compact
            ? 'The Mayor’s office is checking this complaint before it goes to a department.'
            : 'We found something suspicious, so your complaint is being checked by the Mayor’s office. After the review it will either be forwarded to the respective department or rejected.'}
        </div> 
      </div>
    );
  }

  return null;
}
