'use client';

import { useState } from 'react';
import { FormData, FieldConfig } from '@/lib/types';
import formConfig from '@/data/form-config.json';
import LoadingSpinner from './LoadingSpinner';

interface ConsultFormProps {
  specialty: string;
  onResult: (data: {
    displayContent: string;
    recommendedSpecialties: string[];
    redFlags: string[];
    sessionId: string;
  }) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export default function ConsultForm({ specialty, onResult, formData, setFormData }: ConsultFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const specialtySection = formConfig.specialtyFields.find(
    (s) => s.specialtyId === specialty
  );

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleCheckbox = (field: string, value: string) => {
    setFormData((prev) => {
      const current = (prev[field] as string) || '';
      const values = current ? current.split(', ') : [];
      const idx = values.indexOf(value);
      if (idx > -1) {
        values.splice(idx, 1);
      } else {
        values.push(value);
      }
      return { ...prev, [field]: values.join(', ') };
    });
  };

  const isChecked = (field: string, value: string): boolean => {
    const current = (formData[field] as string) || '';
    return current.split(', ').includes(value);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate common fields
    for (const field of formConfig.commonFields) {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = `Vui lòng ${field.type === 'select' ? 'chọn' : 'nhập'} ${field.label.toLowerCase()}`;
      }
    }

    // Special validation for khuVucKhac
    if (formData.khuVuc === 'Tỉnh khác' && !formData.khuVucKhac?.trim()) {
      newErrors.khuVucKhac = 'Vui lòng nhập tên tỉnh/thành phố';
    }

    // Validate specialty fields
    if (specialtySection) {
      for (const field of specialtySection.fields) {
        if (field.required && !formData[field.id]?.trim()) {
          newErrors[field.id] = `Vui lòng ${field.type === 'select' ? 'chọn' : field.type === 'checkbox-group' ? 'chọn' : 'nhập'} ${field.label.toLowerCase()}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialty, formData }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      onResult(data);
    } catch {
      setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`;

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  const renderField = (field: FieldConfig) => {
    const fieldId = field.id;
    const value = (formData[fieldId] as string) || '';

    switch (field.type) {
      case 'text':
        return (
          <div key={fieldId}>
            <label className={labelClass}>{field.label}{field.required ? ' *' : ''}</label>
            <input
              type="text"
              className={inputClass(fieldId)}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => updateField(fieldId, e.target.value)}
            />
            {errors[fieldId] && <p className="text-red-500 text-xs mt-1">{errors[fieldId]}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={fieldId}>
            <label className={labelClass}>{field.label}{field.required ? ' *' : ''}</label>
            <input
              type="number"
              step={field.step}
              className={inputClass(fieldId)}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => updateField(fieldId, e.target.value)}
            />
            {errors[fieldId] && <p className="text-red-500 text-xs mt-1">{errors[fieldId]}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={fieldId}>
            <label className={labelClass}>{field.label}{field.required ? ' *' : ''}</label>
            <select
              className={inputClass(fieldId)}
              value={value}
              onChange={(e) => updateField(fieldId, e.target.value)}
            >
              <option value="">-- Chọn --</option>
              {field.options?.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {errors[fieldId] && <p className="text-red-500 text-xs mt-1">{errors[fieldId]}</p>}
            {/* Special: khuVuc "Tỉnh khác" shows text input */}
            {fieldId === 'khuVuc' && formData.khuVuc === 'Tỉnh khác' && (
              <div className="mt-2">
                <input
                  type="text"
                  className={inputClass('khuVucKhac')}
                  placeholder="Nhập tên tỉnh/thành phố..."
                  value={formData.khuVucKhac || ''}
                  onChange={(e) => updateField('khuVucKhac', e.target.value)}
                />
                {errors.khuVucKhac && <p className="text-red-500 text-xs mt-1">{errors.khuVucKhac}</p>}
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldId}>
            <label className={labelClass}>{field.label}{field.required ? ' *' : ''}</label>
            <textarea
              className={inputClass(fieldId)}
              rows={field.rows || 2}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => updateField(fieldId, e.target.value)}
            />
            {errors[fieldId] && <p className="text-red-500 text-xs mt-1">{errors[fieldId]}</p>}
          </div>
        );

      case 'checkbox-group':
        return (
          <div key={fieldId}>
            <label className={labelClass}>{field.label}{field.required ? ' *' : ''}</label>
            <div className={`grid grid-cols-2 ${field.gridCol === 4 ? 'sm:grid-cols-4' : field.gridCol === 3 ? 'sm:grid-cols-3' : ''} gap-2 mt-1`}>
              {field.options?.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked(fieldId, o)}
                    onChange={() => toggleCheckbox(fieldId, o)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {o}
                </label>
              ))}
            </div>
            {errors[fieldId] && <p className="text-red-500 text-xs mt-1">{errors[fieldId]}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  // Group common fields into grid rows based on gridCol
  const renderCommonFields = () => {
    const elements: React.ReactNode[] = [];
    let i = 0;
    const fields = formConfig.commonFields;

    while (i < fields.length) {
      const field = fields[i];
      // If gridCol === 2, pair with next field that also has gridCol === 2
      if (field.gridCol === 2 && i + 1 < fields.length && fields[i + 1].gridCol === 2) {
        elements.push(
          <div key={`grid-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(field as FieldConfig)}
            {renderField(fields[i + 1] as FieldConfig)}
          </div>
        );
        i += 2;
      } else if (field.gridCol === 2) {
        elements.push(
          <div key={`grid-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(field as FieldConfig)}
          </div>
        );
        i += 1;
      } else {
        elements.push(renderField(field as FieldConfig));
        i += 1;
      }
    }
    return elements;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {renderCommonFields()}

      {specialtySection && (
        <div className="border-t pt-5 space-y-4">
          <h3 className="font-semibold text-blue-700">{specialtySection.sectionTitle}</h3>
          {(() => {
            const elements: React.ReactNode[] = [];
            let i = 0;
            const fields = specialtySection.fields;

            while (i < fields.length) {
              const field = fields[i];
              if (field.gridCol === 2 && i + 1 < fields.length && fields[i + 1].gridCol === 2) {
                elements.push(
                  <div key={`sgrid-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderField(field as FieldConfig)}
                    {renderField(fields[i + 1] as FieldConfig)}
                  </div>
                );
                i += 2;
              } else {
                elements.push(renderField(field as FieldConfig));
                i += 1;
              }
            }
            return elements;
          })()}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Đang phân tích dữ liệu lâm sàng..." />
      ) : (
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Phân tích &amp; Tư vấn
        </button>
      )}
    </form>
  );
}
