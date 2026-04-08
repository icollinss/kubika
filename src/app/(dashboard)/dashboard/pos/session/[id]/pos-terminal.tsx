"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, X, CheckCircle2, Loader2 } from "lucide-react";
import { recordPosSale, closePosSession } from "@/lib/actions/pos";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  internalRef: string | null;
  salePrice: number;
  taxRate?: number;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  taxRate: number;
  quantity: number;
}

interface Session {
  id: string;
  number: string;
  status: string;
  openedAt: Date | string;
  orders?: { id: string; total: number; createdAt: Date | string }[];
}

interface Props {
  session: Session;
  products: Product[];
}

const paymentMethods = [
  { value: "CASH",          label: "Cash",          icon: Banknote },
  { value: "MOBILE_MONEY",  label: "Mobile Money",  icon: Smartphone },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: CreditCard },
];

export function PosTerminal({ session, products }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payDialog, setPayDialog] = useState(false);
  const [payMethod, setPayMethod] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [paying, setPaying] = useState(false);
  const [lastSale, setLastSale] = useState<{ total: number; change: number } | null>(null);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [closing, setClosing] = useState(false);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.internalRef ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        unitPrice: product.salePrice,
        taxRate: 14,
        quantity: 1,
      }];
    });
  }, []);

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.productId === productId ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0);
  const tax = cart.reduce((sum, c) => sum + c.quantity * c.unitPrice * (c.taxRate / 100), 0);
  const total = subtotal + tax;
  const received = parseFloat(amountReceived) || 0;
  const change = Math.max(0, received - total);

  const sessionTotal = (session.orders ?? []).reduce((s, o) => s + o.total, 0);

  async function handlePay() {
    if (cart.length === 0) return;
    setPaying(true);
    try {
      const result = await recordPosSale({
        sessionId: session.id,
        lines: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          taxRate: c.taxRate,
        })),
        paymentMethod: payMethod as "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CHECK" | "CREDIT",
        amountReceived: received,
      });
      setLastSale({ total: result.total, change: result.change });
      setCart([]);
      setPayDialog(false);
      setAmountReceived("");
      setReceiptDialog(true);
      router.refresh();
    } finally {
      setPaying(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      await closePosSession(session.id, parseFloat(closingCash) || 0);
    } finally {
      setClosing(false);
    }
  }

  if (session.status === "CLOSED") {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Session Closed</h3>
        <p className="text-muted-foreground">Session {session.number} has been closed.</p>
        <Button asChild variant="outline"><Link href="/dashboard/pos">Back to POS</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-6">
      {/* Left — Product catalog */}
      <div className="flex flex-col flex-1 border-r bg-muted/20 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-green-600">OPEN</Badge>
            <span className="font-mono font-semibold">{session.number}</span>
            <span className="text-sm text-muted-foreground">
              {new Date(session.openedAt).toLocaleTimeString("pt-AO")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Today: {sessionTotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
            <Button variant="outline" size="sm" onClick={() => setCloseDialog(true)}>Close Session</Button>
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/pos">Exit</Link></Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search products by name or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex flex-col items-start p-3 rounded-xl border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all text-left shadow-sm active:scale-95"
              >
                <div className="w-full aspect-square rounded-lg bg-muted mb-2 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-xs font-semibold leading-tight line-clamp-2">{p.name}</p>
                {p.internalRef && <p className="text-xs text-muted-foreground mt-0.5">{p.internalRef}</p>}
                <p className="text-sm font-bold text-primary mt-1">
                  {p.salePrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">No products found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Right — Cart */}
      <div className="flex flex-col w-80 bg-background">
        <div className="px-4 py-3 border-b font-semibold flex items-center justify-between">
          <span>Cart</span>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-destructive hover:text-destructive h-7 px-2">
              <Trash2 className="h-3.5 w-3.5 mr-1" />Clear
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 px-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <ShoppingBag className="h-8 w-8 mb-2 opacity-40" />
              Click products to add
            </div>
          ) : (
            <div className="space-y-2 py-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.unitPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.productId, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.productId, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.productId)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals + Pay */}
        <div className="border-t px-4 py-4 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{subtotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IVA (14%)</span><span>{tax.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span><span>{total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => { setAmountReceived(total.toFixed(2)); setPayDialog(true); }}
          >
            <CreditCard className="h-4 w-4 mr-2" />Pay Now
          </Button>
        </div>
      </div>

      {/* Payment dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Complete Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <m.icon className="h-4 w-4" />
                        {m.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold">{total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</p>
            </div>
            <div className="space-y-2">
              <Label>Amount Received (AOA)</Label>
              <Input
                type="number"
                min={total}
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="text-lg font-semibold"
                autoFocus
              />
            </div>
            {received >= total && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Change</p>
                <p className="text-xl font-bold text-green-600">{change.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</p>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={paying || received < total}
              onClick={handlePay}
            >
              {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt / success dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="sm:max-w-xs text-center">
          <div className="flex flex-col items-center space-y-3 py-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold">Payment Successful</h3>
            {lastSale !== null && (
              <>
                <p className="text-muted-foreground text-sm">Total: <strong>{lastSale!.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</strong></p>
                {lastSale!.change > 0 && (
                  <p className="text-sm">Change: <strong className="text-green-600">{lastSale!.change.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</strong></p>
                )}
              </>
            )}
            <Button className="w-full mt-2" onClick={() => setReceiptDialog(false)}>
              Next Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close session dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Close Session</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders today</span>
                <span className="font-semibold">{(session.orders ?? []).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total sales</span>
                <span className="font-semibold">{sessionTotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Closing Cash Count (AOA)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">Count the physical cash in the till.</p>
            </div>
            <Button variant="destructive" className="w-full" disabled={closing} onClick={handleClose}>
              {closing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Close Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
