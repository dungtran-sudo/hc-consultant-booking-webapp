'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FieldConfig {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  rows?: number;
  step?: string;
  gridCol?: number;
}

interface SpecialtyFieldGroup {
  specialtyId: string;
  sectionTitle: string;
  fields: FieldConfig[];
}

interface FormConfig {
  commonFields: FieldConfig[];
  specialtyFields: SpecialtyFieldGroup[];
}

const FIELD_TYPES = ['text', 'number', 'select', 'textarea', 'checkbox-group'];

const TABS = [
  { id: 'common', label: 'Chung' },
  { id: 'nhi', label: 'Nhi khoa' },
  { id: 'da-lieu', label: 'Da liễu' },
  { id: 'sinh-san', label: 'Sinh sản' },
  { id: 'std-sti', label: 'STD/STI' },
  { id: 'tieu-hoa', label: 'Tiêu hoá' },
];

function FieldCard({
  field,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
}: {
  field: FieldConfig;
  index: number;
  total: number;
  onUpdate: (updated: FieldConfig) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field);

  const save = () => {
    onUpdate(draft);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            <p className="text-sm text-gray-500">
              id: {field.id} | type: {field.type}
              {field.options ? ` | ${field.options.length} options` : ''}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onMove('up')}
              disabled={index === 0}
              className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              &uarr;
            </button>
            <button
              onClick={() => onMove('down')}
              disabled={index === total - 1}
              className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              &darr;
            </button>
            <button
              onClick={() => { setDraft(field); setEditing(true); }}
              className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Sửa
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1 text-sm text-red-500 hover:text-red-700"
            >
              Xoá
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ID</label>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded text-sm"
            value={draft.id}
            onChange={(e) => setDraft({ ...draft, id: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded text-sm"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            className="w-full px-2 py-1 border rounded text-sm"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Required</label>
          <select
            className="w-full px-2 py-1 border rounded text-sm"
            value={draft.required ? 'true' : 'false'}
            onChange={(e) => setDraft({ ...draft, required: e.target.value === 'true' })}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Grid Column</label>
          <select
            className="w-full px-2 py-1 border rounded text-sm"
            value={draft.gridCol || ''}
            onChange={(e) => setDraft({ ...draft, gridCol: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Full width</option>
            <option value="2">Half (2-col)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
        <input
          type="text"
          className="w-full px-2 py-1 border rounded text-sm"
          value={draft.placeholder || ''}
          onChange={(e) => setDraft({ ...draft, placeholder: e.target.value || undefined })}
        />
      </div>
      {(draft.type === 'select' || draft.type === 'checkbox-group') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Options (one per line)
          </label>
          <textarea
            className="w-full px-2 py-1 border rounded text-sm"
            rows={4}
            value={(draft.options || []).join('\n')}
            onChange={(e) =>
              setDraft({ ...draft, options: e.target.value.split('\n').filter(Boolean) })
            }
          />
        </div>
      )}
      {draft.type === 'textarea' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rows</label>
          <input
            type="number"
            className="w-full px-2 py-1 border rounded text-sm"
            value={draft.rows || 2}
            onChange={(e) => setDraft({ ...draft, rows: Number(e.target.value) })}
          />
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          Lưu
        </button>
        <button onClick={() => setEditing(false)} className="px-3 py-1 bg-gray-200 rounded text-sm">
          Huỷ
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [activeTab, setActiveTab] = useState('common');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/form-config')
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const getFields = (): FieldConfig[] => {
    if (activeTab === 'common') return config.commonFields;
    const group = config.specialtyFields.find((s) => s.specialtyId === activeTab);
    return group?.fields || [];
  };

  const setFields = (fields: FieldConfig[]) => {
    if (activeTab === 'common') {
      setConfig({ ...config, commonFields: fields });
    } else {
      setConfig({
        ...config,
        specialtyFields: config.specialtyFields.map((s) =>
          s.specialtyId === activeTab ? { ...s, fields } : s
        ),
      });
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const fields = [...getFields()];
    const target = direction === 'up' ? index - 1 : index + 1;
    [fields[index], fields[target]] = [fields[target], fields[index]];
    setFields(fields);
  };

  const updateField = (index: number, updated: FieldConfig) => {
    const fields = [...getFields()];
    fields[index] = updated;
    setFields(fields);
  };

  const deleteField = (index: number) => {
    const fields = [...getFields()];
    fields.splice(index, 1);
    setFields(fields);
  };

  const addField = () => {
    const fields = [...getFields()];
    fields.push({
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
    });
    setFields(fields);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/admin/form-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }
      setSaveMessage('Saved successfully');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const fields = getFields();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Form Config</h1>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Trang chủ
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {fields.map((field, i) => (
            <FieldCard
              key={field.id}
              field={field}
              index={i}
              total={fields.length}
              onUpdate={(updated) => updateField(i, updated)}
              onDelete={() => deleteField(i)}
              onMove={(dir) => moveField(i, dir)}
            />
          ))}
        </div>

        <button
          onClick={addField}
          className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Thêm field mới
        </button>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Config'}
          </button>
          {saveMessage && (
            <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
