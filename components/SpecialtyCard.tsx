'use client';

import Link from 'next/link';
import { Specialty } from '@/lib/types';

interface SpecialtyCardProps {
  specialty: Specialty;
}

export default function SpecialtyCard({ specialty }: SpecialtyCardProps) {
  return (
    <Link href={`/consult/${specialty.id}`}>
      <div className="bg-blue-50 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        <h3 className="text-lg font-semibold mb-2 text-blue-700">
          {specialty.label}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{specialty.description}</p>
        <div className="text-sm font-medium text-blue-700 flex items-center gap-1">
          Bắt đầu tư vấn
          <span aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
