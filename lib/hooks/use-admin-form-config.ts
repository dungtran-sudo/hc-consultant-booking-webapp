import useSWR from 'swr';
import { adminFetcher } from '@/lib/swr';

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

export function useAdminFormConfig(secret: string) {
  const { data, error, isLoading, mutate } = useSWR<FormConfig>(
    secret ? '/api/admin/form-config' : null,
    adminFetcher(secret),
    { dedupingInterval: 60 * 60_000, revalidateOnFocus: false },
  );

  return {
    config: data ?? null,
    isLoading,
    error,
    mutate,
  };
}

export type { FieldConfig, SpecialtyFieldGroup, FormConfig };
