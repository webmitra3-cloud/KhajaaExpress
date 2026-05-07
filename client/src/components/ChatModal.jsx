import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../app/AuthProvider";

const ChatModal = ({ orderId, onClose }) => {
  const { user, socket } = useAuth();
  const [message, setMessage] = useState("");

  const messagesQuery = useQuery({
    queryKey: ["messages", orderId],
    queryFn: async () => (await api.get(`/api/messages/${orderId}`)).data.data
  });

  const sendMutation = useMutation({
    mutationFn: async () =>
      (await api.post("/api/messages", { orderId, content: message })).data.data,
    onSuccess: () => {
      setMessage("");
      messagesQuery.refetch();
    }
  });

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      if (payload.orderId === orderId) {
        messagesQuery.refetch();
      }
    };
    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }, [socket, orderId, messagesQuery]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-ink">Order Chat</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>
        <div className="mt-4 h-72 space-y-3 overflow-y-auto rounded-2xl border border-orange-100 p-3 text-sm">
          {messagesQuery.data?.map((msg) => (
            <div
              key={msg._id}
              className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                msg.senderUserId === user?._id
                  ? "ml-auto bg-primary-500 text-white"
                  : "bg-orange-50 text-gray-700"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-2xl border border-orange-100 px-4 py-2 text-sm"
          />
          <button
            onClick={() => message.trim() && sendMutation.mutate()}
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
