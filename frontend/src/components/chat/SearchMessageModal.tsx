import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X, Search, Loader } from "lucide-react";
import { chatService } from "@/services/chatService";
import type { Message } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSearchStore } from "@/stores/useSearchStore";

interface SearchMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onSelectMessage?: (message: Message) => void;
}

const SearchMessageModal = ({
  isOpen,
  onClose,
  conversationId,
  onSelectMessage,
}: SearchMessageModalProps) => {
  const { user } = useAuthStore();
  const { setHighlightedMessage, setSearchResults, clearSearchResults } = useSearchStore();
  const [keyword, setKeyword] = useState("");
  const [localResults, setLocalResults] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const results = await chatService.searchMessages(conversationId, keyword);
      setLocalResults(results);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error("Lỗi tìm kiếm tin nhắn:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMessage = (message: Message) => {
    if (onSelectMessage) {
      onSelectMessage(message);
    }
    
    // Highlight ngay lập tức
    setHighlightedMessage(message._id);
    
    // Scroll to message (không cần chờ)
    const element = document.getElementById(`message-${message._id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    
    clearSearchResults();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tìm kiếm tin nhắn</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="p-4 border-b">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={isLoading} size="icon">
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!hasSearched ? (
            <div className="p-8 text-center text-muted-foreground">
              Nhập từ khóa để bắt đầu tìm kiếm
            </div>
          ) : localResults.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Không tìm thấy tin nhắn nào
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {localResults.map((message) => (
                <button
                  key={message._id}
                  onClick={() => handleSelectMessage(message)}
                  className="w-full text-left p-3 rounded-lg hover:bg-secondary transition border border-transparent hover:border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.senderId && typeof message.senderId !== "string" ? (
                          <>
                            {message.senderId._id === user?._id ? "Bạn" : message.senderId.displayName}
                          </>
                        ) : (
                          "Người gửi"
                        )}
                      </p>
                      <p className="text-sm text-foreground line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                    <time className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {new Date(message.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </time>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchMessageModal;
