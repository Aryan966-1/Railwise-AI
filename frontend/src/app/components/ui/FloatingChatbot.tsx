import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  IndianRupee,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Train,
  X,
} from "lucide-react";

import {
  assistantChat,
  type AssistantAction,
  type AssistantFormPayload,
  type AssistantSearchPayload,
  type SearchResult,
} from "../../utils/backendApi";


interface FloatingChatbotProps {
  currentForm: AssistantFormPayload;
  onFillForm: (payload: AssistantFormPayload) => void;
  onSearchResults: (payload: AssistantSearchPayload & AssistantFormPayload) => void;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  action?: AssistantAction;
  results?: SearchResult[];
  searchNote?: string;
  provider?: string;
  canOpenResults?: boolean;
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

const welcomeMessage: ChatMessage = {
  id: "assistant-welcome",
  role: "assistant",
  text: "I can fill the form, help search trains, and guide booking. Try a route and date, or ask for cheapest or fastest options.",
};


export function FloatingChatbot({ currentForm, onFillForm, onSearchResults }: FloatingChatbotProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isLoading, isOpen, messages]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((currentMessages) => [...currentMessages, message]);
  };

  const handleAssistantAction = (action: AssistantAction | undefined, payload: (AssistantSearchPayload & AssistantFormPayload) | undefined) => {
    if (!payload) {
      return;
    }

    if (action === "fill_form") {
      onFillForm(payload);
      return;
    }

    if (action === "search_results") {
      onSearchResults(payload);
    }
  };

  const handleSend = async () => {
    if (isLoading || !inputValue.trim()) {
      return;
    }

    const nextUserMessage = inputValue.trim();
    appendMessage({
      id: createMessageId("user"),
      role: "user",
      text: nextUserMessage,
    });
    setIsLoading(true);

    try {
      const response = await assistantChat({
        message: nextUserMessage,
        current_form: currentForm,
      });
      const assistantData = response.data;

      if (!assistantData) {
        throw new Error("Assistant response was empty.");
      }

      handleAssistantAction(assistantData.action, assistantData.payload);
      appendMessage({
        id: createMessageId("assistant"),
        role: "assistant",
        text: assistantData.reply,
        action: assistantData.action,
        results: assistantData.payload?.results ?? [],
        searchNote: assistantData.payload?.message,
        provider: assistantData.payload?.provider,
        canOpenResults: (assistantData.payload?.results?.length ?? 0) > 0,
      });
      setInputValue("");
    } catch (error) {
      appendMessage({
        id: createMessageId("assistant"),
        role: "assistant",
        text: error instanceof Error ? error.message : "The assistant could not process that request.",
        action: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl flex items-center justify-center group"
        style={{
          boxShadow: "0 0 40px rgba(139, 92, 246, 0.5), 0 8px 24px rgba(0, 0, 0, 0.2)",
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {isOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <MessageCircle className="w-7 h-7 text-white" />
          )}
        </motion.div>

        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.45, 0, 0.45],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 pointer-events-none"
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-[26rem] max-w-[calc(100vw-3rem)] h-[560px] rounded-3xl backdrop-blur-2xl bg-white/90 dark:bg-slate-900/85 border border-border/50 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Assistant</h3>
                  <p className="text-xs text-white/80">Train booking help, not a generic chatbot</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-border/40 bg-background/50">
              <p className="text-xs text-muted-foreground">
                I can fill the form, help search trains, and guide booking.
              </p>
            </div>

            <div className="p-4 h-[390px] overflow-y-auto space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.role === "assistant" ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-3 max-w-[84%] ${
                      message.role === "assistant"
                        ? "bg-muted/50 rounded-tl-none"
                        : "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-none"
                    }`}
                  >
                    <p className="text-sm leading-6">{message.text}</p>

                    {message.results && message.results.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.results.slice(0, 3).map((result) => (
                          <div
                            key={`${message.id}-${result.train_id}-${result.class_type}`}
                            className="rounded-2xl border border-border/40 bg-background/70 p-3 text-foreground"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Train className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <p className="font-semibold text-sm">{result.train_name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {result.class_type} | {result.available_seats} seats left
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold flex items-center gap-1 justify-end">
                                  <IndianRupee className="w-3 h-3" />
                                  {result.price}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {result.source} to {result.destination}
                              </span>
                              <span>{formatTime(result.departure_time)} - {formatTime(result.arrival_time)}</span>
                            </div>
                          </div>
                        ))}

                        {message.searchNote && (
                          <p className="text-xs text-muted-foreground">
                            {message.searchNote}
                            {message.provider ? ` (${message.provider})` : ""}
                          </p>
                        )}

                        {message.canOpenResults && (
                          <button
                            type="button"
                            onClick={() => navigate("/trains")}
                            className="w-full mt-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            Open Full Results
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                      Thinking through your trip...
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background/70 backdrop-blur-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Ask about trains, search, or booking..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-full bg-muted/50 border border-border/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm disabled:opacity-60"
                />
                <motion.button
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  onClick={() => void handleSend()}
                  disabled={isLoading || !inputValue.trim()}
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <LoaderCircle className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
