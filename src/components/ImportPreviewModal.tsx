import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface PreviewData {
  Teacher: string;
  Weekday: string;
  LessonNumber: number;
  Class: string;
  Subgroup: string;
  Subject: string;
  Room: string;
}

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: PreviewData[];
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  data,
}: ImportPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview Import Data</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] mt-4">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className="text-left p-2">Teacher</th>
                <th className="text-left p-2">Day</th>
                <th className="text-left p-2">Lesson</th>
                <th className="text-left p-2">Class</th>
                <th className="text-left p-2">Subgroup</th>
                <th className="text-left p-2">Subject</th>
                <th className="text-left p-2">Room</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{row.Teacher}</td>
                  <td className="p-2">{row.Weekday}</td>
                  <td className="p-2">{row.LessonNumber}</td>
                  <td className="p-2">{row.Class}</td>
                  <td className="p-2">{row.Subgroup || '-'}</td>
                  <td className="p-2">{row.Subject}</td>
                  <td className="p-2">{row.Room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}