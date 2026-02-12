'use client';

export default function PartnerLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <img src="/logo.jpeg" alt="Hello Health Group" className="h-14 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Portal Đối Tác
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Hello Bác Sĩ
        </p>
        <p className="text-gray-600">
          Vui lòng sử dụng link đăng nhập được cung cấp bởi quản trị viên.
        </p>
      </div>
    </div>
  );
}
