'use client';

import { AnalysisResult as AnalysisResultType } from '@/lib/types';

interface AnalysisResultProps {
  result: AnalysisResultType;
}

function getUrgencyStyle(line: string): { bg: string; border: string; text: string; badge: string } {
  if (line.includes('CẤP CỨU')) {
    return { bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-800', badge: 'bg-red-600 text-white' };
  }
  if (line.includes('KHẨN CẤP')) {
    return { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-800', badge: 'bg-orange-500 text-white' };
  }
  return { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', badge: 'bg-green-600 text-white' };
}

function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentSection = '';
  let urgencyStyle = { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', badge: 'bg-green-600 text-white' };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- Urgency triage (dynamic color based on level) ---
    if (line.startsWith('## ') && line.includes('Mức độ khẩn cấp')) {
      currentSection = 'urgency';
      elements.push(
        <div key={i} className="mt-4 mb-2">
          <h3 className="text-lg font-bold text-gray-800">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    // --- Red flags ---
    if (line.startsWith('## ') && line.includes('Dấu hiệu đỏ')) {
      currentSection = 'red-flags';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-red-50 border-l-4 border-red-500 p-3">
          <h3 className="text-lg font-bold text-red-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    // --- Medication notes ---
    if (line.startsWith('## ') && line.includes('Lưu ý thuốc')) {
      currentSection = 'medication';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-amber-50 border-l-4 border-amber-500 p-3">
          <h3 className="text-lg font-bold text-amber-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    // --- CS staff script ---
    if (line.startsWith('## ') && line.includes('Kịch bản tư vấn')) {
      currentSection = 'cs-script';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-indigo-50 border-l-4 border-indigo-400 p-3">
          <h3 className="text-lg font-bold text-indigo-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    // --- Specialty recommendation ---
    if (line.startsWith('## ') && line.includes('Chuyên khoa đề xuất')) {
      currentSection = 'specialty';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-blue-50 border-l-4 border-blue-500 p-3">
          <h3 className="text-lg font-bold text-blue-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    // --- Public hospital ---
    if (line.startsWith('## ') && line.includes('Bệnh viện') && line.includes('công lập')) {
      currentSection = 'public-hospital';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-blue-50 border-l-4 border-blue-400 p-3">
          <h3 className="text-lg font-bold text-blue-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    // --- Preparation checklist ---
    if (line.startsWith('## ') && line.includes('Chuẩn bị trước khi khám')) {
      currentSection = 'preparation';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-emerald-50 border-l-4 border-emerald-500 p-3">
          <h3 className="text-lg font-bold text-emerald-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    // --- Cost & insurance info ---
    if (line.startsWith('## ') && (line.includes('chi phí') || line.includes('BHYT'))) {
      currentSection = 'cost';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-teal-50 border-l-4 border-teal-500 p-3">
          <h3 className="text-lg font-bold text-teal-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    // --- Generic heading ---
    if (line.startsWith('## ')) {
      currentSection = 'normal';
      elements.push(
        <h3 key={i} className="text-lg font-bold text-gray-800 mt-6 mb-2 border-b pb-1">
          {line.replace(/^##\s*/, '')}
        </h3>
      );
      continue;
    }

    if (line.startsWith('DISCLAIMER:') || line.startsWith('---')) {
      continue;
    }

    if (line.trim() === '') {
      elements.push(<br key={i} />);
      continue;
    }

    // --- Urgency badge line (detect CẤP CỨU / KHẨN CẤP / BÌNH THƯỜNG) ---
    if (currentSection === 'urgency' && (line.includes('CẤP CỨU') || line.includes('KHẨN CẤP') || line.includes('BÌNH THƯỜNG'))) {
      urgencyStyle = getUrgencyStyle(line);
      const label = line.includes('CẤP CỨU') ? 'CẤP CỨU' : line.includes('KHẨN CẤP') ? 'KHẨN CẤP' : 'BÌNH THƯỜNG';
      elements.push(
        <div key={i} className={`${urgencyStyle.bg} border-l-4 ${urgencyStyle.border} p-3 rounded-r-lg`}>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${urgencyStyle.badge}`}>
            {label}
          </span>
          <p className={`mt-1 ${urgencyStyle.text} leading-relaxed`}>
            {line.replace(/^[-•]\s*/, '').replace(/(CẤP CỨU|KHẨN CẤP|BÌNH THƯỜNG):?\s*/, '')}
          </p>
        </div>
      );
      continue;
    }

    // --- Preparation checklist: render - lines as checkbox items ---
    if (currentSection === 'preparation' && line.match(/^[-•]\s/)) {
      elements.push(
        <p key={i} className="text-emerald-700 bg-emerald-50 px-3 py-1 leading-relaxed">
          {'☐ ' + line.replace(/^[-•]\s*/, '')}
        </p>
      );
      continue;
    }

    // --- CS script: italic styling ---
    if (currentSection === 'cs-script') {
      elements.push(
        <p key={i} className="text-indigo-700 bg-indigo-50 px-3 py-1 leading-relaxed italic">
          {line}
        </p>
      );
      continue;
    }

    // --- Section-specific text styling ---
    const wrapperClass =
      currentSection === 'red-flags'
        ? 'text-red-700 bg-red-50 px-3 py-1'
        : currentSection === 'medication'
        ? 'text-amber-700 bg-amber-50 px-3 py-1'
        : currentSection === 'specialty'
        ? 'text-blue-700 bg-blue-50 px-3 py-1'
        : currentSection === 'public-hospital'
        ? 'text-blue-700 bg-blue-50 px-3 py-1'
        : currentSection === 'urgency'
        ? `${urgencyStyle.text} ${urgencyStyle.bg} px-3 py-1`
        : currentSection === 'preparation'
        ? 'text-emerald-700 bg-emerald-50 px-3 py-1'
        : currentSection === 'cost'
        ? 'text-teal-700 bg-teal-50 px-3 py-1'
        : 'text-gray-700';

    elements.push(
      <p key={i} className={`${wrapperClass} leading-relaxed`}>
        {line}
      </p>
    );
  }

  return elements;
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Kết quả phân tích lâm sàng</h2>
      <div className="prose max-w-none">{renderContent(result.displayContent)}</div>
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>Lưu ý:</strong> Đây là thông tin tham khảo từ AI, không thay thế cho việc khám và chẩn đoán trực tiếp từ bác sĩ.
      </div>
    </div>
  );
}
