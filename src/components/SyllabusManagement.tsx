import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Database } from "@/lib/database.types";
import {
  Edit,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Upload,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "./ui/use-toast";

type Syllabus = Database["public"]["Tables"]["syllabus"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];

type SyllabusData = Syllabus & {
  teachers: Teacher | null;
  subjects: Subject | null;
  classes: Class | null;
};

type Column = {
  id: keyof SyllabusData;
  label: string;
  sortable?: boolean;
};

const columns: Column[] = [
  { id: "class_id", label: "Class" },
  { id: "subject_id", label: "Subject", sortable: true },
  { id: "amount_of_academic_hours_per_week", label: "Hours/Week" },
  { id: "teacher_id", label: "Teacher", sortable: true },
];

type SortConfig = {
  key: keyof SyllabusData;
  direction: "asc" | "desc";
} | null;

interface SyllabusFormData {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  amount_of_academic_hours_per_week: number;
}

const SyllabusForm = ({
  mode,
  initialData,
  onSubmit,
  classes,
  subjects,
  teachers,
}: {
  mode: "add" | "edit";
  initialData?: SyllabusFormData;
  onSubmit: (data: SyllabusFormData) => void;
  classes: Class[];
  subjects: Subject[];
  teachers: Teacher[];
}) => {
  const [formData, setFormData] = useState<SyllabusFormData>(
    initialData || {
      class_id: "",
      subject_id: "",
      teacher_id: "",
      amount_of_academic_hours_per_week: 0,
    },
  );

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="class">Class</Label>
        <Select
          value={formData.class_id}
          onValueChange={(value) =>
            setFormData({ ...formData, class_id: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Select
          value={formData.subject_id}
          onValueChange={(value) =>
            setFormData({ ...formData, subject_id: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="teacher">Teacher</Label>
        <Select
          value={formData.teacher_id}
          onValueChange={(value) =>
            setFormData({ ...formData, teacher_id: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="hours">Hours per Week</Label>
        <Input
          id="hours"
          type="number"
          min="1"
          value={formData.amount_of_academic_hours_per_week}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount_of_academic_hours_per_week: parseInt(e.target.value, 10),
            })
          }
        />
      </div>

      <Button className="w-full" onClick={() => onSubmit(formData)}>
        {mode === "add" ? "Add Syllabus" : "Update Syllabus"}
      </Button>
    </div>
  );
};

const SyllabusManagement = () => {
  const { toast } = useToast();
  const [syllabuses, setSyllabuses] = useState<SyllabusData[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "subject_id",
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | "all">("all");
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof SyllabusData>>(
    new Set(columns.map((col) => col.id)),
  );
  const [editingSyllabus, setEditingSyllabus] = useState<SyllabusData | null>(
    null,
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [syllabusData, classesData, teachersData, subjectsData] =
        await Promise.all([
          supabase.from("syllabus").select(
            `
              *,
              teachers:teacher_id(name),
              subjects:subject_id(name),
              classes:class_id(name)
            `,
          ),
          supabase.from("classes").select("*").order("grade"),
          supabase.from("teachers").select("*").order("name"),
          supabase.from("subjects").select("*").order("name"),
        ]);

      if (syllabusData.error) throw syllabusData.error;
      if (classesData.error) throw classesData.error;
      if (teachersData.error) throw teachersData.error;
      if (subjectsData.error) throw subjectsData.error;

      setSyllabuses(syllabusData.data || []);
      setClasses(classesData.data || []);
      setTeachers(teachersData.data || []);
      setSubjects(subjectsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (key: keyof SyllabusData) => {
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

  const getSortIcon = (key: keyof SyllabusData) => {
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
    if (selectedRows.size === filteredSyllabuses.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredSyllabuses.map((s) => s.id)));
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

  const toggleColumn = (columnId: keyof SyllabusData) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(value === "all" ? "all" : Number(value));
    setPage(1);
  };

  const filteredSyllabuses = React.useMemo(() => {
    let result = [...syllabuses];

    if (selectedClass !== "all") {
      result = result.filter((s) => s.class_id === selectedClass);
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Get display values for sorting
        if (sortConfig.key === "subject_id") {
          aValue = subjects.find((s) => s.id === aValue)?.name || "";
          bValue = subjects.find((s) => s.id === bValue)?.name || "";
        } else if (sortConfig.key === "teacher_id") {
          aValue = teachers.find((t) => t.id === aValue)?.name || "";
          bValue = teachers.find((t) => t.id === bValue)?.name || "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [syllabuses, sortConfig, selectedClass, subjects, teachers]);

  const paginatedSyllabuses = React.useMemo(() => {
    if (rowsPerPage === "all") return filteredSyllabuses;
    const start = (page - 1) * rowsPerPage;
    return filteredSyllabuses.slice(start, start + rowsPerPage);
  }, [filteredSyllabuses, page, rowsPerPage]);

  const totalPages =
    rowsPerPage === "all"
      ? 1
      : Math.ceil(filteredSyllabuses.length / (rowsPerPage as number));

  const handleAddSyllabus = async (data: SyllabusFormData) => {
    try {
      const { error } = await supabase.from("syllabus").insert([data]);
      if (error) throw error;
      fetchData();
      toast({
        title: "Success",
        description: "Syllabus added successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding syllabus",
        description: error.message,
      });
    }
  };

  const handleUpdateSyllabus = async (data: SyllabusFormData) => {
    if (!editingSyllabus) return;

    try {
      const { error } = await supabase
        .from("syllabus")
        .update(data)
        .eq("id", editingSyllabus.id);

      if (error) throw error;
      fetchData();
      setEditingSyllabus(null);
      toast({
        title: "Success",
        description: "Syllabus updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating syllabus",
        description: error.message,
      });
    }
  };

  const handleDeleteSyllabus = async (id: string) => {
    try {
      const { error } = await supabase.from("syllabus").delete().eq("id", id);
      if (error) throw error;
      fetchData();
      toast({
        title: "Success",
        description: "Syllabus deleted successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting syllabus",
        description: error.message,
      });
    }
  };

  const handleImportJSON = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error("Invalid JSON format. Expected an array.");
      }

      const { error } = await supabase.from("syllabus").insert(data);
      if (error) throw error;

      fetchData();
      toast({
        title: "Success",
        description: "Syllabus data imported successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error importing data",
        description: error.message,
      });
    }

    // Reset the input
    event.target.value = "";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Syllabus Management</CardTitle>
        <div className="flex items-center gap-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2" />
                  Add Syllabus
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Syllabus</DialogTitle>
                </DialogHeader>
                <SyllabusForm
                  mode="add"
                  onSubmit={handleAddSyllabus}
                  classes={classes}
                  subjects={subjects}
                  teachers={teachers}
                />
              </DialogContent>
            </Dialog>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
                id="json-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("json-upload")?.click()}
              >
                <Upload className="mr-2" />
                Import JSON
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === filteredSyllabuses.length}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 2}
                    className="text-center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedSyllabuses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 2}
                    className="text-center"
                  >
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSyllabuses.map((syllabus) => (
                  <TableRow
                    key={syllabus.id}
                    className={
                      selectedRows.has(syllabus.id) ? "bg-slate-50" : ""
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(syllabus.id)}
                        onCheckedChange={() => toggleRow(syllabus.id)}
                      />
                    </TableCell>
                    {columns.map((column) =>
                      visibleColumns.has(column.id) ? (
                        <TableCell key={column.id}>
                          {column.id === "class_id"
                            ? classes.find((c) => c.id === syllabus[column.id])
                                ?.name
                            : column.id === "subject_id"
                              ? subjects.find(
                                  (s) => s.id === syllabus[column.id],
                                )?.name
                              : column.id === "teacher_id"
                                ? teachers.find(
                                    (t) => t.id === syllabus[column.id],
                                  )?.name
                                : syllabus[column.id]}
                        </TableCell>
                      ) : null,
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingSyllabus(syllabus)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Syllabus</DialogTitle>
                            </DialogHeader>
                            <SyllabusForm
                              mode="edit"
                              initialData={{
                                class_id: syllabus.class_id,
                                subject_id: syllabus.subject_id,
                                teacher_id: syllabus.teacher_id,
                                amount_of_academic_hours_per_week:
                                  syllabus.amount_of_academic_hours_per_week,
                              }}
                              onSubmit={handleUpdateSyllabus}
                              classes={classes}
                              subjects={subjects}
                              teachers={teachers}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSyllabus(syllabus.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {selectedRows.size} of {filteredSyllabuses.length} row(s) selected
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
};

export default SyllabusManagement;
