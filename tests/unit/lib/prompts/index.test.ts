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

  describe('Layer 4 — new output sections', () => {
    const specialties = ['nhi', 'da-lieu', 'sinh-san', 'std-sti', 'tieu-hoa'];

    specialties.forEach((specialty) => {
      describe(`${specialty}`, () => {
        const prompt = buildPrompt(specialty, sampleFormData);

        it('includes urgency triage section', () => {
          expect(prompt).toContain('## Mức độ khẩn cấp');
          expect(prompt).toContain('CẤP CỨU');
          expect(prompt).toContain('KHẨN CẤP');
          expect(prompt).toContain('BÌNH THƯỜNG');
        });

        it('includes SOAP sections', () => {
          expect(prompt).toContain('## S — Triệu chứng chủ quan');
          expect(prompt).toContain('## O — Quan sát lâm sàng');
          expect(prompt).toContain('## A — Đánh giá');
          expect(prompt).toContain('## P — Kế hoạch xử trí');
        });

        it('includes red flags section', () => {
          expect(prompt).toContain('## Dấu hiệu đỏ');
        });

        it('includes expanded medication notes with VN-specific warnings', () => {
          expect(prompt).toContain('## Lưu ý thuốc');
          expect(prompt).toContain('88% kháng sinh');
          expect(prompt).toContain('Đông y + Tây y');
          expect(prompt).toContain('Cyproheptadine');
        });

        it('includes CS staff script section', () => {
          expect(prompt).toContain('## Kịch bản tư vấn cho nhân viên');
          expect(prompt).toContain('NGÔN NGỮ ĐƠN GIẢN');
        });

        it('includes specialty recommendation section', () => {
          expect(prompt).toContain('## Chuyên khoa đề xuất đặt lịch');
        });

        it('includes public hospital section', () => {
          expect(prompt).toContain('## Bệnh viện/phòng khám công lập gợi ý');
        });

        it('includes preparation checklist section', () => {
          expect(prompt).toContain('## Chuẩn bị trước khi khám');
          expect(prompt).toContain('CCCD/CMND');
          expect(prompt).toContain('thẻ BHYT');
        });

        it('includes cost & insurance section', () => {
          expect(prompt).toContain('## Thông tin chi phí & BHYT');
          expect(prompt).toContain('vượt tuyến');
        });

        it('includes urgency_label in JSON metadata', () => {
          expect(prompt).toContain('"urgency_label"');
          expect(prompt).toContain('BINH THUONG');
          expect(prompt).toContain('KHAN CAP');
          expect(prompt).toContain('CAP CUU');
        });
      });
    });
  });

  describe('Layer 2 — specialty-specific enrichments', () => {
    it('nhi includes HFMD peak data and ép ăn culture', () => {
      const prompt = buildPrompt('nhi', sampleFormData);
      expect(prompt).toContain('113,121');
      expect(prompt).toContain('ép ăn');
      expect(prompt).toContain('52.7%');
      expect(prompt).toContain('ông bà');
    });

    it('da-lieu includes atopic dermatitis prevalence and ointment compliance', () => {
      const prompt = buildPrompt('da-lieu', sampleFormData);
      expect(prompt).toContain('15.3%');
      expect(prompt).toContain('71.8%');
      expect(prompt).toContain('ointment');
      expect(prompt).toContain('nóng');
    });

    it('sinh-san includes screening gap and lean PCOS', () => {
      const prompt = buildPrompt('sinh-san', sampleFormData);
      expect(prompt).toContain('10-15%');
      expect(prompt).toContain('PCOS');
      expect(prompt).toContain('gầy');
      expect(prompt).toContain('sinh con trai');
    });

    it('std-sti includes antibiotic resistance and anonymous testing sites', () => {
      const prompt = buildPrompt('std-sti', sampleFormData);
      expect(prompt).toContain('cephalosporin');
      expect(prompt).toContain('Pasteur');
      expect(prompt).toContain('VCT');
      expect(prompt).toContain('88%');
    });

    it('tieu-hoa includes gastric cancer rate and liver fluke risk', () => {
      const prompt = buildPrompt('tieu-hoa', sampleFormData);
      expect(prompt).toContain('16.3/100,000');
      expect(prompt).toContain('HBsAg');
      expect(prompt).toContain('Clonorchis');
      expect(prompt).toContain('AFP');
    });
  });
});
