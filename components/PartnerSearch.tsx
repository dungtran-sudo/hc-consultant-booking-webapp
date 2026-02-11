'use client';

import { useState } from 'react';
import { loadPartners } from '@/lib/partners';
import { Partner, Service } from '@/lib/types';
import PartnerCard from './PartnerCard';

interface PartnerSearchProps {
  recommendedSpecialties: string[];
  onBooking: (partner: Partner, service?: Service) => void;
}

const allPartners = loadPartners();

export default function PartnerSearch({ recommendedSpecialties, onBooking }: PartnerSearchProps) {
  const [query, setQuery] = useState('');

  const searchResults = query.trim().length >= 2
    ? allPartners.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase().trim())
      )
    : [];

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Tìm kiếm đối tác</h2>
      <input
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        placeholder="Nhập tên đối tác..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="text-xs text-gray-400 mt-1">Nhập từ 2 ký tự trở lên để tìm kiếm</p>

      {searchResults.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">
            Tìm thấy {searchResults.length} đối tác
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((p) => (
              <PartnerCard
                key={p.id}
                partner={p}
                recommendedSpecialties={recommendedSpecialties}
                onBooking={onBooking}
                showRelevanceBadge
              />
            ))}
          </div>
        </div>
      )}

      {query.trim().length >= 2 && searchResults.length === 0 && (
        <p className="text-gray-500 italic mt-4">Không tìm thấy đối tác nào</p>
      )}
    </div>
  );
}
