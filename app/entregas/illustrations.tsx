import { Truck, Ship } from "lucide-react";

export function RodoviarioArt({ active }: { active: boolean }) {
  return (
    <div
      className={`relative h-24 w-full overflow-hidden rounded-t-2xl transition-opacity ${
        active ? "opacity-100" : "opacity-50"
      }`}
      style={{
        background:
          "radial-gradient(120% 140% at 15% 15%, rgba(201,138,59,0.35), transparent 60%), linear-gradient(160deg, #1a140c 0%, #120d08 60%, #0c0906 100%)",
      }}
    >
      <div className="absolute -right-3 -bottom-5 opacity-90">
        <Truck size={110} strokeWidth={1} color="#C98A3B" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C98A3B] to-transparent" />
    </div>
  );
}

export function FluvialArt({ active }: { active: boolean }) {
  return (
    <div
      className={`relative h-24 w-full overflow-hidden rounded-t-2xl transition-opacity ${
        active ? "opacity-100" : "opacity-50"
      }`}
      style={{
        background:
          "radial-gradient(120% 140% at 85% 15%, rgba(47,184,198,0.30), transparent 60%), linear-gradient(160deg, #0a1a1c 0%, #08161a 60%, #060f12 100%)",
      }}
    >
      <div className="absolute -left-3 -bottom-5 opacity-90">
        <Ship size={110} strokeWidth={1} color="#2FB8C6" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#2FB8C6] to-transparent" />
    </div>
  );
}

export function TodosArt({ active }: { active: boolean }) {
  return (
    <div
      className={`relative h-24 w-full overflow-hidden rounded-t-2xl transition-opacity ${
        active ? "opacity-100" : "opacity-50"
      }`}
      style={{
        background:
          "radial-gradient(120% 140% at 50% 10%, rgba(126,146,166,0.22), transparent 60%), linear-gradient(160deg, #10161c 0%, #0c1116 60%, #090c10 100%)",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-80">
        <Truck size={52} strokeWidth={1} color="#C98A3B" />
        <Ship size={52} strokeWidth={1} color="#2FB8C6" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7E92A6] to-transparent" />
    </div>
  );
}
