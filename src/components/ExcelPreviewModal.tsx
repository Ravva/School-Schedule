import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface ExcelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
}

export function ExcelPreviewModal({ isOpen, onClose, data }: ExcelPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Excel Data Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Weekday</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subgroup</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.Teacher}</TableCell>
                  <TableCell>{row.Weekday}</TableCell>
                  <TableCell>{row.LessonNumber}</TableCell>
                  <TableCell>{row.Class}</TableCell>
                  <TableCell>{row.Subgroup || '-'}</TableCell>
                  <TableCell>{row.Subject}</TableCell>
                  <TableCell>{row.Room}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}