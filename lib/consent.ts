import crypto from 'crypto';

export interface ConsentVersion {
  version: string;
  text: string;
  hash: string;
}

const CONSENT_V1_TEXT = `Đồng ý thu thập và xử lý dữ liệu

Bạn đồng ý cho Hello Bác Sĩ thu thập và xử lý các thông tin sau:

DỮ LIỆU THU THẬP:
• Họ tên, số điện thoại
• Triệu chứng, tình trạng sức khỏe
• Ghi chú thêm (nếu có)

MỤC ĐÍCH SỬ DỤNG:
• Đặt lịch khám với đối tác y tế
• Phân tích triệu chứng bằng AI để tư vấn sơ bộ
• Liên hệ xác nhận lịch hẹn

NƠI LƯU TRỮ:
• Cơ sở dữ liệu mã hoá trên máy chủ bảo mật
• Dữ liệu cá nhân được mã hoá AES-256-GCM

THỜI GIAN LƯU TRỮ:
• Tối đa 12 tháng kể từ ngày tạo
• Sau 12 tháng, dữ liệu sẽ tự động bị xoá

AI ĐƯỢC XEM DỮ LIỆU:
• Đối tác y tế mà bạn đặt lịch (chỉ xem qua portal bảo mật)
• Nhân viên tư vấn Hello Bác Sĩ (để hỗ trợ đặt lịch)

QUYỀN CỦA BẠN:
• Yêu cầu xoá dữ liệu bất kỳ lúc nào
• Liên hệ Hello Bác Sĩ để thực hiện yêu cầu xoá dữ liệu`;

function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export const CURRENT_CONSENT: ConsentVersion = {
  version: 'v1',
  text: CONSENT_V1_TEXT,
  hash: hashText(CONSENT_V1_TEXT),
};

const ALL_VERSIONS: Record<string, ConsentVersion> = {
  v1: CURRENT_CONSENT,
};

export function getConsentVersion(version: string): ConsentVersion | null {
  return ALL_VERSIONS[version] || null;
}

export function validateConsentHash(version: string, hash: string): boolean {
  const consent = getConsentVersion(version);
  if (!consent) return false;
  return consent.hash === hash;
}
