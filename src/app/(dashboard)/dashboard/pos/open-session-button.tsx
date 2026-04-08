"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Loader2 } from "lucide-react";
import { openPosSession } from "@/lib/actions/pos";

interface Props {
  configId: string;
  configName: string;
  className?: string;
}

export function OpenSessionButton({ configId, configName, className }: Props) {
  const [open, setOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState("0");
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setLoading(true);
    try {
      await openPosSession(configId, parseFloat(openingCash) || 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <Play className="h-4 w-4 mr-2" />Open Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Open — {configName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Opening Cash Count (AOA)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Count the cash in the till before starting.</p>
          </div>
          <Button onClick={handleOpen} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Open & Start Selling
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
