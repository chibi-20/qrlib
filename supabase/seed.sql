-- Optional sample data for local testing / thesis demo.
-- Run after schema.sql in the Supabase SQL editor.

insert into students (student_no, full_name, grade_level, section) values
  ('STU-0001', 'Juan Dela Cruz', 'Grade 11', 'STEM-A'),
  ('STU-0002', 'Maria Santos', 'Grade 11', 'STEM-B'),
  ('STU-0003', 'Pedro Reyes', 'Grade 12', 'HUMSS-A'),
  ('STU-0004', 'Ana Garcia', 'Grade 12', 'ABM-A')
on conflict (student_no) do nothing;

insert into books (book_code, title, author, total_copies, available_copies) values
  ('BK-0001', 'Noli Me Tangere', 'Jose Rizal', 3, 3),
  ('BK-0002', 'Introduction to Algorithms', 'Thomas H. Cormen', 2, 2),
  ('BK-0003', 'The Great Gatsby', 'F. Scott Fitzgerald', 2, 2),
  ('BK-0004', 'Sapiens', 'Yuval Noah Harari', 1, 1)
on conflict (book_code) do nothing;
