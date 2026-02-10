'use client';

import Link from 'next/link';
import { Specialty } from '@/lib/types';

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200 hover:border-blue-400', text: 'text-blue-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200 hover:border-green-400', text: 'text-green-700' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200 hover:border-pink-400', text: 'text-pink-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200 hover:border-purple-400', text: 'text-purple-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200 hover:border-orange-400', text: 'text-orange-700' },
};

interface SpecialtyCardProps {
  specialty: Specialty;
}

export default function SpecialtyCard({ specialty }: SpecialtyCardProps) {
  const colors = colorMap[specialty.color] || colorMap.blue;

  return (
    <Link href={`/consult/${specialty.id}`}>
      <div
        className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
      >
        <div className="text-4xl mb-3">{specialty.icon}</div>
        <h3 className={`text-lg font-semibold mb-2 ${colors.text}`}>
          {specialty.label}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{specialty.description}</p>
        <div className={`text-sm font-medium ${colors.text} flex items-center gap-1`}>
          Bắt đầu tư vấn
          <span aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
