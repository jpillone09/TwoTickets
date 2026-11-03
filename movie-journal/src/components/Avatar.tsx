export default function Avatar({ url, name, size = 80 }: { url: string | null; name: string | null; size?: number }) {
  return url ? (
    <img src={url} alt="" style={{ width: size, height: size }} className="rounded-full border-4 border-white object-cover shadow" />
  ) : (
    <div style={{ width: size, height: size, fontSize: size / 2.5 }}
      className="flex items-center justify-center rounded-full border-4 border-white bg-primary font-heading font-bold text-primary-foreground shadow">
      {(name ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}
