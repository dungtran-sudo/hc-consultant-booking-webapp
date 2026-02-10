import SpecialtyCard from '@/components/SpecialtyCard';
import specialties from '@/data/specialties.json';
import { Specialty } from '@/lib/types';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hệ thống Tư vấn Y tế
          </h1>
          <p className="text-gray-600">
            Chọn chuyên khoa để bắt đầu tư vấn
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(specialties as Specialty[]).map((specialty) => (
            <SpecialtyCard key={specialty.id} specialty={specialty} />
          ))}
        </div>

        <footer className="mt-16 text-center text-sm text-gray-400">
          Dành cho nhân viên nội bộ. Thông tin tư vấn chỉ mang tính tham khảo.
        </footer>
      </main>
    </div>
  );
}
