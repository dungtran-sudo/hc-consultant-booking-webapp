import { FormData } from '../types';

export function getEffectiveKhuVuc(formData: FormData): string {
  if (formData.khuVuc === 'Tỉnh khác' && formData.khuVucKhac?.trim()) {
    return formData.khuVucKhac.trim();
  }
  return formData.khuVuc;
}

export function buildExtraFields(formData: FormData, knownFields: string[]): string {
  const extra = Object.entries(formData)
    .filter(([key, val]) => !knownFields.includes(key) && val?.trim())
    .map(([key, val]) => `- ${key}: ${val}`)
    .join('\n');
  return extra ? `\n${extra}` : '';
}

export function layer4(): string {
  return `[YÊU CẦU PHÂN TÍCH VÀ ĐỊNH DẠNG ĐẦU RA]

Hãy phân tích và trả lời CHÍNH XÁC theo cấu trúc dưới đây. Sử dụng đúng các tiêu đề như được chỉ định.

## S — Triệu chứng chủ quan (Subjective)
[Tóm tắt triệu chứng theo lời bệnh nhân/người nhà mô tả]

## O — Quan sát lâm sàng (Objective)
[Các dấu hiệu lâm sàng suy luận được từ dữ liệu cung cấp. Nếu thiếu thông tin khám trực tiếp, ghi rõ điều đó.]

## A — Đánh giá (Assessment)
[Liệt kê các khả năng chẩn đoán theo thứ tự xác suất từ cao đến thấp. Bao gồm cả bệnh lý nhiệt đới nếu phù hợp với khu vực địa lý. Ví dụ: 1. [Chẩn đoán A] - Khả năng cao vì... 2. [Chẩn đoán B] - Cần loại trừ vì...]

## P — Kế hoạch xử trí (Plan)
[Xét nghiệm cần làm, chuyên khoa cần gặp, hướng điều trị ban đầu, theo dõi tại nhà]

## Dấu hiệu đỏ — Cần đến cấp cứu ngay
[Liệt kê bullet point các dấu hiệu nguy hiểm cần nhập viện cấp cứu ngay]

## Lưu ý thuốc
[Đánh giá các thuốc bệnh nhân đã tự dùng. Cảnh báo nếu có dấu hiệu lạm dụng kháng sinh, corticoid, hay thuốc không phù hợp]

## Chuyên khoa đề xuất đặt lịch
[Ghi rõ chuyên khoa ưu tiên khám theo mã: nhi / da-lieu / sinh-san / std-sti / tieu-hoa]

## Bệnh viện/phòng khám công lập gợi ý
[Dựa trên khu vực sinh sống của bệnh nhân, đề xuất 2-3 bệnh viện hoặc phòng khám công lập phù hợp với chuyên khoa cần khám. Ghi rõ tên, địa chỉ, và lý do đề xuất.]

---
DISCLAIMER: Đây là thông tin tham khảo từ AI, không thay thế cho việc khám và chẩn đoán trực tiếp từ bác sĩ. Vui lòng ưu tiên thăm khám trực tiếp tại cơ sở y tế phù hợp.

---
%%JSON_METADATA_START%%
{"recommended_specialties": ["<mã chuyên khoa 1>", "<mã chuyên khoa 2>"], "red_flags_present": <true|false>, "urgency": "<routine|soon|urgent>"}
%%JSON_METADATA_END%%`;
}
