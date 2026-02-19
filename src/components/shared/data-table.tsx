import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Column<T> = {
  key: keyof T & string;
  header: React.ReactNode;
  cell?: (item: T) => React.ReactNode;
};

type DataTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
};

export function DataTable<T extends object>({ columns, data, keyExtractor }: DataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <p className="text-muted-foreground text-sm">Nessun risultato</p>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={keyExtractor(item)}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.cell ? col.cell(item) : String(item[col.key as keyof T] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
