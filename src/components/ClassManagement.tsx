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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Database } from "@/lib/database.types";
import {
  Edit,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
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

type Class = Database["public"]["Tables"]["classes"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

type Column = {
  id: keyof Class;
  label: string;
  sortable?: boolean;
};

const columns: Column[] = [
  { id: "name", label: "Name", sortable: true },
  { id: "grade", label: "Grade", sortable: true },
  { id: "literal", label: "Literal", sortable: true },
  { id: "supervisor_teacher_id", label: "Supervisor" },
  { id: "room_id", label: "Room" },
];

type SortConfig = {
  key: keyof Class;
  direction: "asc" | "desc";
} | null;

const ClassManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | "all">("all");
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Class>>(
    new Set(columns.map((col) => col.id)),
  );

  interface NewClass {
    name: string;
    grade: number;
    literal?: string | null;
    supervisor_teacher_id?: string | null;
    room_id?: string | null;
  }
  const [newClass, setNewClass] = useState<NewClass>({
    name: "",
    grade: 0,
    literal: null,
    supervisor_teacher_id: null,
    room_id: null,
  });
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesData, teachersData, roomsData] = await Promise.all([
        supabase.from("classes").select("*").order("grade"),
        supabase.from("teachers").select("*").order("name"),
        supabase.from("rooms").select("*").order("room_number"),
      ]);

      if (classesData.error) throw classesData.error;
      if (teachersData.error) throw teachersData.error;
      if (roomsData.error) throw roomsData.error;

      setClasses(classesData.data || []);
      setTeachers(teachersData.data || []);
      setRooms(roomsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClass.literal) {
      alert("Please select a class literal.");
      return;
    }
    if (!newClass.grade || newClass.grade < 1 || newClass.grade > 11) {
      alert("Grade must be between 1 and 11.");
      return;
    }
    if (newClass.literal.length > 10) {  // Changed from length !== 1
      alert("Literal must not exceed 10 characters.");
      return;
    }
    // Generate class name before insert
    const className = generateClassName(newClass.grade, newClass.literal);
    if (!className) {
      alert("Invalid class name combination.");
      return;
    }

    try {
      const { error } = await supabase.from("classes").insert([
        {
          name: className,
          grade: newClass.grade,
          literal: newClass.literal,
          supervisor_teacher_id: newClass.supervisor_teacher_id || null,
          room_id: newClass.room_id || null,
        },
      ]);

      if (error) throw error;
      fetchData();
      setNewClass({
        name: "",
        grade: 0,
        literal: null,
        supervisor_teacher_id: null,
        room_id: null,
      });
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Failed to create class. Please try again.");
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    if (!editingClass.literal) {
      alert("Please select a class literal.");
      return;
    }
    if (editingClass.grade < 1 || editingClass.grade > 11) {
      alert("Grade must be between 1 and 11.");
      return;
    }
    if (editingClass.literal.length > 10) {  // Changed from length !== 1
      alert("Literal must not exceed 10 characters.");
      return;
    }
    const className = `${editingClass.grade}${editingClass.literal}`;

    try {
      const { error } = await supabase
        .from("classes")
        .update({
          name: className,
          grade: editingClass.grade,
          literal: editingClass.literal,
          supervisor_teacher_id: editingClass.supervisor_teacher_id,
          room_id: editingClass.room_id,
        })
        .eq("id", editingClass.id);

      if (error) throw error;
      fetchData();
      setEditingClass(null);
    } catch (error) {
      console.error("Error updating class:", error);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting class:", error);
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

  const ClassForm = ({
    mode,
    classData,
    setClassData,
    teachers,
    rooms,
    handleAddClass,
    handleUpdateClass,
  }: {
    mode: "add" | "edit";
    classData: any;
    setClassData: React.Dispatch<React.SetStateAction<any>>;
    teachers: Teacher[];
    rooms: Room[];
    handleAddClass: () => Promise<void>;
    handleUpdateClass: () => Promise<void>;
  }) => {
    if (!classData && mode === "edit") return null;

    const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
        const grade = parseInt(value, 10);
        setClassData((prev: any) => {
          const updated = { ...prev, grade: grade };
          updated.name = generateClassName(updated.grade, updated.literal);
          return updated;
        });
      }
    };

    const handleLiteralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const literal = e.target.value;
      setClassData((prev: any) => {
        const updated = { ...prev, literal: literal };
        updated.name = generateClassName(prev.grade, updated.literal);
        return updated;
      });
    };

    const handleSupervisorTeacherChange = (value: string) => {
      setClassData((prev: any) => ({ ...prev, supervisor_teacher_id: value }));
    };

    const handleRoomChange = (value: string) => {
      setClassData((prev: any) => ({ ...prev, room_id: value }));
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Input
              id="grade"
              type="number"
              min="1"
              max="11"
              value={classData ? classData.grade || "" : ""}
              onChange={handleGradeChange}
              placeholder="Enter grade"
            />
          </div>
          <div>
            <Label htmlFor="literal">Literal</Label>
            <Input
              id="literal"
              value={classData ? classData.literal || "" : ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 10) {  // Changed from 1 to 10
                  handleLiteralChange(e);
                }
              }}
              placeholder="Enter literal"
              maxLength={10}  // Changed from 1 to 10
            />
          </div>
        </div>

        <div>
          <Label htmlFor="supervisor_teacher">Supervisor Teacher</Label>
          <Select
            onValueChange={handleSupervisorTeacherChange}
            value={
              classData
                ? classData.supervisor_teacher_id || undefined
                : undefined
            }
          >
            <SelectTrigger id="supervisor_teacher">
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
          <Label htmlFor="room">Room</Label>
          <Select
            onValueChange={handleRoomChange}
            value={classData ? classData.room_id || undefined : undefined}
          >
            <SelectTrigger id="room">
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.room_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={mode === "add" ? handleAddClass : handleUpdateClass}
        >
          {mode === "add" ? "Add Class" : "Update Class"}
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Class Management</CardTitle>
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
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <ClassForm
                mode="add"
                classData={newClass}
                setClassData={setNewClass}
                teachers={teachers}
                rooms={rooms}
                handleAddClass={handleAddClass}
                handleUpdateClass={handleUpdateClass}
              />
            </DialogContent>
          </Dialog>
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
              ) : paginatedClasses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 2}
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
                        <TableCell key={column.id}>
                          {column.id === "supervisor_teacher_id"
                            ? teachers.find((t) => t.id === cls[column.id])
                                ?.name || "N/A"
                            : column.id === "room_id"
                              ? rooms.find((r) => r.id === cls[column.id])
                                  ?.room_number || "N/A"
                              : cls[column.id]}
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
                              onClick={() => setEditingClass(cls)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Class</DialogTitle>
                            </DialogHeader>
                            <ClassForm
                              mode="edit"
                              classData={editingClass}
                              setClassData={setEditingClass}
                              teachers={teachers}
                              rooms={rooms}
                              handleAddClass={handleAddClass}
                              handleUpdateClass={handleUpdateClass}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClass(cls.id)}
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
};

// Utility function to generate class name
const generateClassName = (grade: number, literal?: string | null) => {
  if (!grade || grade < 1 || grade > 11) {
    return "";
  }
  if (literal && literal.length > 10) {  // Changed from length !== 1
    return "";
  }
  return literal ? `${grade}${literal}` : `${grade}`;
};

export default ClassManagement;
