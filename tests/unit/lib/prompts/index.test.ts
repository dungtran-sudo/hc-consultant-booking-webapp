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

  it('returns string for tim-mach', () => {
    const result = buildPrompt('tim-mach', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns string for co-xuong-khop', () => {
    const result = buildPrompt('co-xuong-khop', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns string for tai-mui-hong', () => {
    const result = buildPrompt('tai-mui-hong', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns string for mat', () => {
    const result = buildPrompt('mat', sampleFormData);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns string for nam-khoa', () => {
    const result = buildPrompt('nam-khoa', sampleFormData);
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
    const specialties = ['nhi', 'da-lieu', 'sinh-san', 'std-sti', 'tieu-hoa', 'tim-mach', 'co-xuong-khop', 'tai-mui-hong', 'mat', 'nam-khoa'];

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

    it('tim-mach includes CVD mortality rate and smoking prevalence', () => {
      const prompt = buildPrompt('tim-mach', sampleFormData);
      expect(prompt).toContain('31%');
      expect(prompt).toContain('45%');
      expect(prompt).toContain('9.4g');
      expect(prompt).toContain('Golden hour');
    });

    it('co-xuong-khop includes osteoarthritis prevalence and NSAID abuse', () => {
      const prompt = buildPrompt('co-xuong-khop', sampleFormData);
      expect(prompt).toContain('30%');
      expect(prompt).toContain('Diclofenac');
      expect(prompt).toContain('Cushing');
      expect(prompt).toContain('Glucosamine');
    });

    it('tai-mui-hong includes NPC epidemiology and nasal spray abuse', () => {
      const prompt = buildPrompt('tai-mui-hong', sampleFormData);
      expect(prompt).toContain('NPC');
      expect(prompt).toContain('EBV');
      expect(prompt).toContain('Xylometazoline');
      expect(prompt).toContain('VA');
    });

    it('mat includes myopia prevalence and corticoid eye drops risk', () => {
      const prompt = buildPrompt('mat', sampleFormData);
      expect(prompt).toContain('52.7%');
      expect(prompt).toContain('Dexamethasone');
      expect(prompt).toContain('Phaco');
      expect(prompt).toContain('LASIK');
    });

    it('nam-khoa includes ED prevalence and cultural barriers', () => {
      const prompt = buildPrompt('nam-khoa', sampleFormData);
      expect(prompt).toContain('30%');
      expect(prompt).toContain('PSA');
      expect(prompt).toContain('Sildenafil');
      expect(prompt).toContain('nam tính');
    });
  });

  describe('Layer 3 — specialty-specific form fields', () => {
    it('tim-mach includes blood pressure field', () => {
      const data = { ...sampleFormData, huyetAp: '140/90' };
      const prompt = buildPrompt('tim-mach', data);
      expect(prompt).toContain('140/90');
    });

    it('co-xuong-khop includes pain location field', () => {
      const data = { ...sampleFormData, viTriDau: 'Khớp gối' };
      const prompt = buildPrompt('co-xuong-khop', data);
      expect(prompt).toContain('Khớp gối');
    });

    it('tai-mui-hong includes affected area field', () => {
      const data = { ...sampleFormData, vungBiAnhHuong: 'Mũi, Xoang' };
      const prompt = buildPrompt('tai-mui-hong', data);
      expect(prompt).toContain('Mũi, Xoang');
    });

    it('mat includes affected eye field', () => {
      const data = { ...sampleFormData, matBiAnhHuong: 'Cả hai mắt' };
      const prompt = buildPrompt('mat', data);
      expect(prompt).toContain('Cả hai mắt');
    });

    it('nam-khoa includes symptom group field', () => {
      const data = { ...sampleFormData, nhomTrieuChung: 'Tiểu khó' };
      const prompt = buildPrompt('nam-khoa', data);
      expect(prompt).toContain('Tiểu khó');
    });
  });
});
