'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import ConsultForm from '@/components/ConsultForm';
import AnalysisResult from '@/components/AnalysisResult';
import PartnerCard from '@/components/PartnerCard';
import BookingModal from '@/components/BookingModal';
import PartnerSearch from '@/components/PartnerSearch';
import specialtiesData from '@/data/specialties.json';
import { filterPartners } from '@/lib/partners';
import StaffAuthGate from '@/components/StaffAuthGate';
import {
  Specialty,
  Partner,
  Service,
  FormData,
  AnalysisResult as AnalysisResultType,
} from '@/lib/types';

const emptyFormData: FormData = {
  hoTen: '',
  tuoi: '',
  gioiTinh: '',
  khuVuc: '',
  trieuChungChinh: '',
  thoiGianKhoiPhat: '',
  thuocDaDung: '',
};

export default function ConsultPage({
  params,
}: {
  params: Promise<{ specialty: string }>;
}) {
  const { specialty: specialtyId } = use(params);
  const specialty = (specialtiesData as Specialty[]).find(
    (s) => s.id === specialtyId
  );

  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [bookingPartner, setBookingPartner] = useState<{
    partner: Partner;
    service?: Service;
  } | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  const handleResult = (data: AnalysisResultType) => {
    setResult(data);
    const effectiveCity = formData.khuVuc === 'Tỉnh khác' && formData.khuVucKhac?.trim()
      ? formData.khuVucKhac.trim()
      : formData.khuVuc;
    const filtered = filterPartners(
      data.recommendedSpecialties,
      effectiveCity
    );
    setPartners(filtered.slice(0, 5));
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  if (!specialty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Chuyên khoa không tồn tại
          </h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StaffAuthGate>
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600">
            Trang chủ
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900">{specialty.label}</span>
        </nav>

        {/* Page title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {specialty.label} — Phiếu Thông Tin Bệnh Nhân
        </h1>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <ConsultForm
            specialty={specialtyId}
            onResult={handleResult}
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        {/* Analysis Result */}
        {result && (
          <div ref={resultRef}>
            <AnalysisResult result={result} />

             {/* Partner Search */}
            <PartnerSearch
              recommendedSpecialties={result.recommendedSpecialties}
              onBooking={(partner, service) =>
                setBookingPartner({ partner, service })
              }
            />

            {/* Partner Cards */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Đối tác đề xuất
              </h2>
              {partners.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partners.map((p) => (
                    <PartnerCard
                      key={p.id}
                      partner={p}
                      recommendedSpecialties={result.recommendedSpecialties}
                      onBooking={(partner, service) =>
                        setBookingPartner({ partner, service })
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Hiện chưa có đối tác trong khu vực này. Vui lòng liên hệ trực
                  tiếp.
                </p>
              )}
            </div>

           
          </div>
        )}

        {/* Booking Modal */}
        {bookingPartner && result && (
          <BookingModal
            partner={bookingPartner.partner}
            service={bookingPartner.service}
            sessionId={result.sessionId}
            patientName={formData.hoTen}
            conditionSummary={formData.trieuChungChinh}
            onClose={() => setBookingPartner(null)}
          />
        )}
      </main>
    </div>
    </StaffAuthGate>
  );
}
