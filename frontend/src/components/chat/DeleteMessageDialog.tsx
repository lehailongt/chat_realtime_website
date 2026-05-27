import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

interface DeleteMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  onSuccess?: (messageId: string) => void;
}

const DeleteMessageDialog = ({
  open,
  onOpenChange,
  messageId,
  onSuccess,
}: DeleteMessageDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMessage = async () => {
    setIsDeleting(true);
    try {
      await chatService.softDeleteMessage(messageId);
      toast.success("Xóa tin nhắn thành công");
      onOpenChange(false);
      onSuccess?.(messageId);
    } catch (error: any) {
      console.error("Delete message error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Lỗi khi xóa tin nhắn";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa tin nhắn?</DialogTitle>
          <DialogDescription>
            Bạn chắc chắn muốn xóa tin nhắn này không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDeleteMessage}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMessageDialog;
