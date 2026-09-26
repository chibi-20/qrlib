export type ImportResult = {
  totalRows: number;
  imported: number;
  errors: { row: number; reason: string }[];
};
