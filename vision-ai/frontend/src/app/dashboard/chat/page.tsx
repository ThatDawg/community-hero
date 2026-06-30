"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Bot, User, Loader2, Languages } from "lucide-react";
import { chatWithAI } from "@/lib/api";

const SYSTEM_PROMPT = `You are Vision AI, a helpful assistant for a civic issue reporting platform.
You help citizens report issues, check status, and provide information about local government services.
Be helpful, concise, and friendly. If asked about a specific issue, provide relevant details.
If the user describes an issue, help them categorize it and suggest next steps.
If information is missing (like location or description details), ask follow-up questions.
When reporting, ask: What is the issue? Where is it? How severe is it? When did you notice it?
You can respond in any language the user writes in.`;

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "ar-SA", label: "Arabic" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ja-JP", label: "Japanese" },
  { code: "pt-BR", label: "Portuguese" },
  { code: "bn-IN", label: "Bengali" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm Vision AI, your civic issue reporting assistant. I can help you:\n\n- Report a civic issue (I'll ask follow-up questions to get all details)\n- Check the status of your reports\n- Get information about local services\n- Find nearby reported issues\n- Translate information to your language\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const callGemini = async (userMessage: string) => {
    const langName = LANGUAGES.find((l) => l.code === selectedLang)?.label || "English";
    const langInstruction = selectedLang !== "en-US"
      ? `\n\nIMPORTANT: The user's preferred language is ${langName}. Translate your entire response to ${langName}.`
      : "";

    try {
      const result = await chatWithAI(userMessage, SYSTEM_PROMPT + langInstruction);
      return result.response;
    } catch (error) {
      console.error("AI chat failed:", error);
      return "AI chat is temporarily unavailable. Please check that the backend URL is configured and running.";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await callGemini(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognitionAPI = typeof window !== "undefined"
      ? (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
      : null;

    if (!SpeechRecognitionAPI) {
      console.error("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new (SpeechRecognitionAPI as new () => unknown)() as Record<string, unknown>;
    recognition.lang = selectedLang;
    recognition.interimResults = true;
    recognition.continuous = false;

    (recognition as { onresult: (event: unknown) => void }).onresult = (event: unknown) => {
      const e = event as { results: Array<Array<{ transcript: string }>> };
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    (recognition as { onend: () => void }).onend = () => {
      setRecording(false);
    };

    (recognition as { onerror: () => void }).onerror = () => {
      setRecording(false);
      console.error("Speech recognition failed");
    };

    recognitionRef.current = recognition;
    (recognition as { start: () => void }).start();
    setRecording(true);
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
    }
    setRecording(false);
  };

  return (
    <div className="flex flex-col h-screen p-6">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant
              <span className="text-sm font-normal text-muted-foreground">powered by Gemini</span>
            </CardTitle>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowLangMenu(!showLangMenu)}>
                <Languages className="h-4 w-4 mr-1" />
                {LANGUAGES.find((l) => l.code === selectedLang)?.label}
              </Button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-auto w-40">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${selectedLang === lang.code ? "bg-primary/10" : ""}`}
                      onClick={() => { setSelectedLang(lang.code); setShowLangMenu(false); }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="mt-1 text-xs opacity-60">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Button
              variant={recording ? "destructive" : "outline"}
              size="icon"
              onClick={recording ? stopVoiceInput : startVoiceInput}
              title="Voice input (Web Speech API)"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={!input.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
