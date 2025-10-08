// Shared types
export interface BaseEntity {
  id: string | number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FormFieldProps extends ComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
}

