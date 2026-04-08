"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, MessageCircle, CheckCircle, XCircle } from "lucide-react";

interface Props {
  defaultPhone?: string;
  onSend: (phone: string) => Promise<void>;
  label?: string;
}

export function WhatsappSendButton({ defaultPhone, onSend, label = "Send via WhatsApp" }: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSend() {
    if (!phone.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      await onSend(phone.trim());
      setStatus("sent");
      setTimeout(() => { setOpen(false); setStatus("idle"); }, 1500);
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Failed to send");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Send via WhatsApp
            </DialogTitle>
          </DialogHeader>

          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-sm font-medium">Message sent successfully!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244 912 345 678"
                />
                <p className="text-xs text-muted-foreground">
                  Include country code, e.g. +244 for Angola
                </p>
              </div>

              {status === "error" && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-xs">{errorMsg}</p>
                </div>
              )}
            </div>
          )}

          {status !== "sent" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={status === "sending" || !phone.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {status === "sending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <MessageCircle className="mr-2 h-4 w-4" />
                Send
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
