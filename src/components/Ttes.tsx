import * as React from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

type Class = {
  id: string;
  name: string;
  grade: number;
  literal: string;
  supervisor_teacher_id: string | null;
  room_id: string | null;
  supervisor_name?: string;
  room_number?: string;
};

type Column = {
  id: keyof Class;
  label: string;
  sortable?: boolean;
};

const columns: Column[] = [
  { id: "name", label: "Name", sortable: true },
  { id: "grade", label: "Grade", sortable: true },
  { id: "literal", label: "Literal", sortable: true },
  { id: "room_number", label: "Room" },
  { id: "supervisor_name", label: "Supervisor" },
];

type SortConfig = {
  key: keyof Class;
  direction: "asc" | "desc";
} | null;

export default function Ttes() {
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(
    new Set(),
  );
  const [filterText, setFilterText] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState<number | "all">("all");
  const [visibleColumns, setVisibleColumns] = React.useState<Set<keyof Class>>(
    new Set(columns.map((col) => col.id)),
  );

  React.useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      // Fetch classes with joined data
      const { data, error } = await supabase
        .from("classes")
        .select(
          `
          *,
          teachers:supervisor_teacher_id(name),
          rooms:room_id(room_number)
        `,
        )
        .order("grade");

      if (error) throw error;

      // Transform the data to include supervisor and room names
      const transformedData = (data || []).map((cls) => ({
        ...cls,
        supervisor_name: cls.teachers?.name || "N/A",
        room_number: cls.rooms?.room_number || "N/A",
      }));

      setClasses(transformedData);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (key: keyof Class) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        }
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key: keyof Class) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === "asc" ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      );
    }
    return <ChevronsUpDown className="w-4 h-4" />;
  };

  const toggleAllRows = () => {
    if (selectedRows.size === filteredClasses.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredClasses.map((cls) => cls.id)));
    }
  };

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleColumn = (columnId: keyof Class) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  const filteredClasses = React.useMemo(() => {
    let result = [...classes];

    if (filterText) {
      result = result.filter((cls) =>
        Object.entries(cls)
          .filter(([key]) => visibleColumns.has(key as keyof Class))
          .some(([_, value]) =>
            String(value).toLowerCase().includes(filterText.toLowerCase()),
          ),
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [classes, filterText, sortConfig, visibleColumns]);

  const paginatedClasses = React.useMemo(() => {
    if (rowsPerPage === "all") return filteredClasses;
    const start = (page - 1) * rowsPerPage;
    return filteredClasses.slice(start, start + rowsPerPage);
  }, [filteredClasses, page, rowsPerPage]);

  const totalPages =
    rowsPerPage === "all"
      ? 1
      : Math.ceil(filteredClasses.length / (rowsPerPage as number));

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(value === "all" ? "all" : Number(value));
    setPage(1);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Classes</CardTitle>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-64"
          />
          <Select
            value={String(rowsPerPage)}
            onValueChange={handleRowsPerPageChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="20">20 rows</SelectItem>
              <SelectItem value="all">All rows</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === filteredClasses.length}
                    onCheckedChange={toggleAllRows}
                  />
                </TableHead>
                {columns.map((column) =>
                  visibleColumns.has(column.id) ? (
                    <TableHead
                      key={column.id}
                      className={column.sortable ? "cursor-pointer" : ""}
                      onClick={() => column.sortable && toggleSort(column.id)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}{" "}
                        {column.sortable && getSortIcon(column.id)}
                      </div>
                    </TableHead>
                  ) : null,
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="text-center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedClasses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="text-center"
                  >
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClasses.map((cls) => (
                  <TableRow
                    key={cls.id}
                    className={selectedRows.has(cls.id) ? "bg-slate-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(cls.id)}
                        onCheckedChange={() => toggleRow(cls.id)}
                      />
                    </TableCell>
                    {columns.map((column) =>
                      visibleColumns.has(column.id) ? (
                        <TableCell key={column.id}>{cls[column.id]}</TableCell>
                      ) : null,
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {selectedRows.size} of {filteredClasses.length} row(s) selected
          </div>
          {rowsPerPage !== "all" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="text-sm">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
