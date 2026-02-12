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

Hãy phân tích và trả lời CHÍNH XÁC theo cấu trúc dưới đây. Sử dụng đúng các tiêu đề như được chỉ định. KHÔNG bỏ sót mục nào.

## Mức độ khẩn cấp
[Phân loại CHÍNH XÁC 1 trong 3 mức sau:
- CẤP CỨU: Có nguy cơ tử vong hoặc tổn thương nghiêm trọng nếu không xử trí trong vài giờ (VD: đau ngực dữ dội, khó thở nặng, xuất huyết ồ ạt, co giật, mất ý thức, sốt cao >40°C kèm co giật ở trẻ em)
- KHẨN CẤP: Cần khám trong 24-48h, có nguy cơ biến chứng nếu trì hoãn (VD: sốt cao >39°C kéo dài >3 ngày, đau bụng dữ dội, mất nước trung bình, phát ban lan nhanh)
- BÌNH THƯỜNG: Có thể đặt lịch khám trong tuần, không có dấu hiệu nguy hiểm tức thời
Ghi rõ mức độ và lý do phân loại.]

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
[Đánh giá các thuốc bệnh nhân đã tự dùng. LUÔN kiểm tra và cảnh báo cụ thể:
- Kháng sinh tự mua: 88% kháng sinh tại VN bán không cần đơn — cảnh báo nguy cơ kháng thuốc nếu bệnh nhân tự dùng
- Corticosteroid/kem trộn: Nhiều bệnh nhân da liễu tự mua kem trộn chứa corticoid không rõ nguồn gốc — cảnh báo tác dụng phụ
- PPI lạm dụng: Thuốc dạ dày (omeprazole, esomeprazole) dùng kéo dài >8 tuần không có chỉ định bác sĩ
- Đông y + Tây y: Xung đột thuốc khi bệnh nhân dùng song song thuốc Đông y và Tây y mà không báo bác sĩ
- Nhi khoa: Sai liều hạ sốt (paracetamol, ibuprofen) theo cân nặng, dùng aspirin cho trẻ em, lạm dụng thuốc kích thích ăn (Cyproheptadine)
Nếu bệnh nhân không nêu thuốc đã dùng, nhắc nhở CS hỏi lại vì tự mua thuốc rất phổ biến tại VN.]

## Kịch bản tư vấn cho nhân viên
[Viết 3-5 câu BẰNG NGÔN NGỮ ĐƠN GIẢN mà nhân viên CS đọc trực tiếp cho bệnh nhân/người nhà qua điện thoại hoặc chat. Không dùng thuật ngữ y khoa. Bao gồm: (1) tóm tắt tình trạng, (2) mức độ khẩn cấp bằng lời dễ hiểu, (3) việc cần làm tiếp theo. VD: "Dạ, theo thông tin anh/chị cung cấp, bé có dấu hiệu... Trường hợp này cần được bác sĩ khám trong vòng... Em sẽ hỗ trợ đặt lịch khám tại..."]

## Chuyên khoa đề xuất đặt lịch
[Ghi rõ chuyên khoa ưu tiên khám theo mã: nhi / da-lieu / sinh-san / std-sti / tieu-hoa / tim-mach / co-xuong-khop / tai-mui-hong / mat / nam-khoa. Nếu cần khám nhiều chuyên khoa, sắp xếp theo thứ tự ưu tiên.]

## Bệnh viện/phòng khám công lập gợi ý
[Dựa trên khu vực sinh sống của bệnh nhân, đề xuất 2-3 bệnh viện hoặc phòng khám công lập phù hợp với chuyên khoa cần khám. Ghi rõ tên, địa chỉ, và lý do đề xuất.]

## Chuẩn bị trước khi khám
[Liệt kê dạng checklist những gì bệnh nhân cần chuẩn bị trước buổi khám:
- Giấy tờ: CCCD/CMND, thẻ BHYT (nếu có), sổ khám bệnh cũ
- Kết quả xét nghiệm/chụp chiếu gần đây (nếu có)
- Yêu cầu nhịn ăn nếu cần xét nghiệm máu (ghi rõ bao nhiêu giờ)
- Ghi chép triệu chứng: thời điểm bắt đầu, tần suất, mức độ
- Danh sách thuốc đang dùng (bao gồm thuốc Đông y, thực phẩm chức năng)
- Yêu cầu đặc biệt khác tuỳ chuyên khoa]

## Thông tin chi phí & BHYT
[Cung cấp thông tin chi phí ước tính:
- Khám tại BV công lập CÓ BHYT: phí khám + xét nghiệm cơ bản thường được BHYT chi trả 80-100% nếu đúng tuyến. Nếu vượt tuyến: BHYT chỉ chi trả 40-60% (tuyến TW) hoặc 60-70% (tuyến tỉnh).
- Khám tại BV công lập KHÔNG BHYT: ước tính chi phí khám + xét nghiệm cơ bản
- Lưu ý vượt tuyến: Nếu bệnh nhân ở tỉnh muốn khám BV tuyến trung ương tại TPHCM/Hà Nội, cần giấy chuyển viện để hưởng BHYT đầy đủ
Ghi rõ đây là ước tính tham khảo, chi phí thực tế tuỳ cơ sở y tế.]

---
DISCLAIMER: Đây là thông tin tham khảo từ AI, không thay thế cho việc khám và chẩn đoán trực tiếp từ bác sĩ.

---
%%JSON_METADATA_START%%
{"recommended_specialties": ["<mã chuyên khoa 1>", "<mã chuyên khoa 2>"], "red_flags_present": <true|false>, "urgency": "<routine|soon|urgent>", "urgency_label": "<BINH THUONG|KHAN CAP|CAP CUU>"}
%%JSON_METADATA_END%%`;
}
