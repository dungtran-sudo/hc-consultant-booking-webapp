'use client';

export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      {message && <p className="ml-3 text-gray-600">{message}</p>}
    </div>
  );
}
