'use client';

import { Partner, Service } from '@/lib/types';

interface PartnerCardProps {
  partner: Partner;
  recommendedSpecialties: string[];
  onBooking: (partner: Partner, service?: Service) => void;
}

export default function PartnerCard({ partner, recommendedSpecialties, onBooking }: PartnerCardProps) {
  const relevantServices = partner.services.filter((s) =>
    recommendedSpecialties.includes(s.specialty)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 mb-1">{partner.name}</h3>
      <p className="text-sm text-gray-500 mb-2">
        {partner.city}{partner.district ? ` - ${partner.district}` : ''}
      </p>
      {partner.address && (
        <p className="text-sm text-gray-600 mb-2">{partner.address}</p>
      )}

      <div className="flex flex-wrap gap-3 mb-3 text-sm">
        {partner.phone && (
          <a href={`tel:${partner.phone}`} className="text-teal-600 hover:underline">
            {partner.phone}
          </a>
        )}
        {partner.website && (
          <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Website
          </a>
        )}
      </div>

      {partner.notes && (
        <p className="text-xs text-gray-500 mb-3 italic">{partner.notes}</p>
      )}

      {relevantServices.length > 0 ? (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Dịch vụ liên quan:</p>
          <ul className="space-y-1">
            {relevantServices.map((s) => (
              <li key={s.id} className="text-sm text-gray-600 flex justify-between items-center">
                <span>{s.name}</span>
                <span className="text-xs text-gray-400">{s.price_range}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-3 italic">
          Liên hệ trực tiếp để biết dịch vụ và gói khám
        </p>
      )}

      <button
        onClick={() => onBooking(partner, relevantServices[0])}
        className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
      >
        Đặt lịch ngay &rarr;
      </button>
    </div>
  );
}
