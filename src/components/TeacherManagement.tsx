import React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Edit, Plus, Trash2 } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  supervisedClasses: string[];
}

interface TeacherManagementProps {
  teachers?: Teacher[];
  onAddTeacher?: (teacher: Omit<Teacher, "id">) => void;
  onEditTeacher?: (teacher: Teacher) => void;
  onDeleteTeacher?: (id: string) => void;
}

const defaultTeachers: Teacher[] = [
  {
    id: "1",
    name: "John Smith",
    subjects: ["Mathematics", "Physics"],
    supervisedClasses: ["10A", "11B"],
  },
  {
    id: "2",
    name: "Sarah Johnson",
    subjects: ["English", "Literature"],
    supervisedClasses: ["9C", "12A"],
  },
  {
    id: "3",
    name: "Michael Brown",
    subjects: ["Chemistry", "Biology"],
    supervisedClasses: ["11A", "12B"],
  },
];

const TeacherManagement = ({
  teachers = defaultTeachers,
  onAddTeacher = () => {},
  onEditTeacher = () => {},
  onDeleteTeacher = () => {},
}: TeacherManagementProps) => {
  return (
    <div className="p-6 bg-white">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Teacher Management</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter teacher name" />
                </div>
                <div>
                  <Label>Subjects</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Supervised Classes</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10a">10A</SelectItem>
                      <SelectItem value="11b">11B</SelectItem>
                      <SelectItem value="12c">12C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Save Teacher</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Supervised Classes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.supervisedClasses.map((className) => (
                        <Badge key={className} variant="outline">
                          {className}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherManagement;
