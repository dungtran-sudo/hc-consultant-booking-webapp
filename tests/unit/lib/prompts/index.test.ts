import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildPrompt } from '@/lib/prompts/index';
import type { FormData } from '@/lib/types';

const sampleFormData: FormData = {
  hoTen: 'Test',
  tuoi: '5',
  gioiTinh: 'Nam',
  khuVuc: 'TP.HCM',
  trieuChungChinh: 'sốt',
  thoiGianKhoiPhat: 'Hôm nay',
  thuocDaDung: '',
};

describe('buildPrompt', () => {
  it('returns string for nhi', () => {
    const result = buildPrompt('nhi', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns string for da-lieu', () => {
    const result = buildPrompt('da-lieu', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns string for sinh-san', () => {
    const result = buildPrompt('sinh-san', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns string for std-sti', () => {
    const result = buildPrompt('std-sti', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns string for tieu-hoa', () => {
    const result = buildPrompt('tieu-hoa', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('throws for unknown specialty', () => {
    expect(() => buildPrompt('unknown', sampleFormData)).toThrow(
      'Unknown specialty: unknown'
    );
  });

  it('includes formData in prompt', () => {
    const result = buildPrompt('nhi', sampleFormData);
    expect(result).toContain('Test');
    expect(result).toContain('sốt');
    expect(result).toContain('TP.HCM');
    expect(result).toContain('Hôm nay');
  });
});
