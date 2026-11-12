import React from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const markerColor = (status) => {
    switch (status) {
        case 'pending':
            return '#ef4444';
        case 'in_progress':
            return '#f59e0b';
        case 'completed':
            return '#22c55e';
        case 'rejected':
            return '#6b7280';
        default:
            return '#3b82f6';
    }
};

const createColoredIcon = (color) =>
    new L.DivIcon({
        className: 'custom-map-marker',
        html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
      "></div>
    `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });

// spread overlapping markers slightly
const spreadOverlappingMarkers = (complaints) => {
    const locationMap = new Map();

    return complaints.map((complaint) => {
        const key = `${complaint.location.lat.toFixed(5)}_${complaint.location.lng.toFixed(5)}`;
        const count = locationMap.get(key) || 0;
        locationMap.set(key, count + 1);

        if (count === 0) return complaint;

        const angle = (count * 45) * (Math.PI / 180);
        const offset = 0.00015 * Math.ceil(count / 2);

        return {
            ...complaint,
            displayLat: complaint.location.lat + Math.cos(angle) * offset,
            displayLng: complaint.location.lng + Math.sin(angle) * offset,
            overlapIndex: count
        };
    });
};

export default function ComplaintMap({ complaints = [] }) {
    const validComplaints = complaints.filter(
        (c) =>
            c.location &&
            typeof c.location.lat === 'number' &&
            typeof c.location.lng === 'number' &&
            c.location.lat !== 0 &&
            c.location.lng !== 0
    );

    const invalidCount = complaints.length - validComplaints.length;
    const spreadComplaints = spreadOverlappingMarkers(validComplaints);

    const center =
        spreadComplaints.length > 0
            ? [spreadComplaints[0].location.lat, spreadComplaints[0].location.lng]
            : [23.2599, 77.4126];

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5" /> Complaint Map Visualization</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Showing {spreadComplaints.length} complaints on map
                        {invalidCount > 0 ? ` • ${invalidCount} complaints hidden (missing location)` : ''}
                    </p>
                </div>

                <div className="flex gap-3 text-xs text-gray-300 flex-wrap">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                        Pending
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
                        In Progress
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                        Completed
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-gray-500 inline-block" />
                        Rejected
                    </span>
                </div>
            </div>

            {spreadComplaints.length === 0 ? (
                <div className="h-[420px] flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No complaints with valid location found
                </div>
            ) : (
                <div className="h-[420px] rounded-xl overflow-hidden border border-gray-200">
                    <MapContainer
                        center={center}
                        zoom={13}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {spreadComplaints.map((complaint) => (
                            <Marker
                                key={complaint._id}
                                position={[
                                    complaint.displayLat || complaint.location.lat,
                                    complaint.displayLng || complaint.location.lng
                                ]}
                                icon={createColoredIcon(markerColor(complaint.status))}
                            >
                                <Popup>
                                    <div className="min-w-[220px]">
                                        <div className="font-bold text-sm text-gray-800 mb-1">
                                            {complaint.title}
                                        </div>

                                        <div className="text-xs text-gray-500 mb-2">
                                            {complaint.complaintNumber}
                                        </div>

                                        <div className="space-y-1 text-xs">
                                            <div><strong>Category:</strong> {complaint.category}</div>
                                            <div><strong>Status:</strong> {complaint.status}</div>
                                            <div><strong>Priority:</strong> {complaint.priority}</div>
                                            <div><strong>Department:</strong> {complaint.departmentId?.name || 'Not Assigned'}</div>
                                            <div><strong>Citizen:</strong> {complaint.citizenId?.name || 'Unknown'}</div>
                                            <div><strong>Address:</strong> {complaint.location?.address || 'No address'}</div>
                                            {complaint.overlapIndex ? (
                                                <div className="text-orange-600">
                                                    <strong>Note:</strong> This marker was shifted slightly to show overlapping complaints.
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}
        </div>
    );
}
