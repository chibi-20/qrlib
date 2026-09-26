export type TransactionStatus = "borrowed" | "returned" | "overdue";

export interface Student {
  id: string;
  student_no: string;
  full_name: string;
  grade_level: string;
  section: string;
  created_at: string;
}

export interface Book {
  id: string;
  book_code: string;
  title: string;
  author: string | null;
  total_copies: number;
  available_copies: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  student_id: string;
  book_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  status: TransactionStatus;
  scan_duration_ms: number | null;
  created_by: string | null;
  created_at: string;
}

export interface TransactionWithRelations extends Transaction {
  student: Student;
  book: Book;
}
