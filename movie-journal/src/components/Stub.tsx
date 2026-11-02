import { Sparkles } from "lucide-react";

export default function Stub({ title, note }: { title: string; note: string }) {
  return (
    <div className="sticker-card mx-auto mt-10 max-w-lg p-8 text-center">
      <Sparkles className="mx-auto mb-3 text-primary" />
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{note}</p>
    </div>
  );
}
