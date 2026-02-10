'use client';

import { AnalysisResult as AnalysisResultType } from '@/lib/types';

interface AnalysisResultProps {
  result: AnalysisResultType;
}

function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ⚠️') || line.startsWith('## ⚠')) {
      currentSection = 'red-flags';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-red-50 border-l-4 border-red-500 p-3">
          <h3 className="text-lg font-bold text-red-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    if (line.startsWith('## 💊')) {
      currentSection = 'medication';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-amber-50 border-l-4 border-amber-500 p-3">
          <h3 className="text-lg font-bold text-amber-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

    if (line.startsWith('## 🏥')) {
      currentSection = 'specialty';
      elements.push(
        <div key={i} className="mt-6 mb-2 bg-teal-50 border-l-4 border-teal-500 p-3">
          <h3 className="text-lg font-bold text-teal-700">{line.replace(/^##\s*/, '')}</h3>
        </div>
      );
      continue;
    }

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
      if (line.startsWith('DISCLAIMER:')) {
        elements.push(
          <div key={i} className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-4 text-sm text-gray-600 italic">
            {line}
          </div>
        );
      }
      continue;
    }

    if (line.trim() === '') {
      elements.push(<br key={i} />);
      continue;
    }

    const wrapperClass =
      currentSection === 'red-flags'
        ? 'text-red-700 bg-red-50 px-3 py-1'
        : currentSection === 'medication'
        ? 'text-amber-700 bg-amber-50 px-3 py-1'
        : currentSection === 'specialty'
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
        <strong>⚠️ Lưu ý:</strong> Đây là thông tin tham khảo từ AI, không thay thế cho việc khám và chẩn đoán trực tiếp từ bác sĩ.
      </div>
    </div>
  );
}
