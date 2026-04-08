import { notFound } from "next/navigation";
import { getPosSession, getPosProducts } from "@/lib/actions/pos";
import { PosTerminal } from "./pos-terminal";

interface Props { params: Promise<{ id: string }> }

export default async function PosSessionPage({ params }: Props) {
  const { id } = await params;
  const [session, products] = await Promise.all([
    getPosSession(id),
    getPosProducts(),
  ]);
  if (!session) notFound();

  return <PosTerminal session={session} products={products} />;
}
