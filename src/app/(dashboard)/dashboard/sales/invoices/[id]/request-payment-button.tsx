"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, CreditCard, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { generatePaymentLink } from "@/lib/actions/payment-providers";

export function RequestPaymentButton({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const url = await generatePaymentLink(invoiceId);
      setLink(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setOpen(false);
    setLink("");
    setError("");
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}
        className="border-blue-400 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950">
        <CreditCard className="h-4 w-4 mr-2" />Request Payment
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />Request Payment
            </DialogTitle>
          </DialogHeader>

          {!link ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a secure payment link using your configured payment provider. Share it with your client via WhatsApp, email, or any channel.
              </p>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                  Generate Link
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium text-sm">Payment link created!</span>
              </div>
              <div className="p-3 bg-muted rounded-lg text-xs font-mono break-all">{link}</div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={handleCopy}>
                  {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={link} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with your client. Payment confirmation will automatically update this invoice.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
