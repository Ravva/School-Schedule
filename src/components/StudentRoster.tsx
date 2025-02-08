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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Student {
  id: string;
  name: string;
  grade: string;
  subgroup: "1" | "2";
  subjects: Array<{
    name: string;
    grade: string;
  }>;
}

interface StudentRosterProps {
  students?: Student[];
  selectedClass?: string;
}

const StudentRoster = ({
  students = [
    {
      id: "1",
      name: "Alice Johnson",
      grade: "10A",
      subgroup: "1",
      subjects: [
        { name: "Mathematics", grade: "A" },
        { name: "Science", grade: "B+" },
        { name: "English", grade: "A-" },
      ],
    },
    {
      id: "2",
      name: "Bob Smith",
      grade: "10A",
      subgroup: "2",
      subjects: [
        { name: "Mathematics", grade: "B" },
        { name: "Science", grade: "A" },
        { name: "English", grade: "B+" },
      ],
    },
  ],
  selectedClass = "10A",
}: StudentRosterProps) => {
  return (
    <div className="w-full h-full min-h-[800px] bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Student Roster</h1>
        <Select defaultValue={selectedClass}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10A">Class 10A</SelectItem>
            <SelectItem value="10B">Class 10B</SelectItem>
            <SelectItem value="10C">Class 10C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList>
          <TabsTrigger value="roster">Class Roster</TabsTrigger>
          <TabsTrigger value="grades">Grade Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Subgroup</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Group {student.subgroup}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Grade Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Mathematics</TableHead>
                      <TableHead>Science</TableHead>
                      <TableHead>English</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        {student.subjects.map((subject, index) => (
                          <TableCell key={index}>
                            <Badge
                              variant={
                                subject.grade.startsWith("A")
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {subject.grade}
                            </Badge>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentRoster;
