import Image from "next/image";

export function RodoviarioArt({ active }: { active: boolean }) {
  return (
    <div
      className={`relative h-32 w-full overflow-hidden rounded-t-2xl transition-opacity ${
        active ? "opacity-100" : "opacity-60"
      }`}
    >
      <Image
        src="/rodoviario.jpg"
        alt="Caminhão em estrada"
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        className="object-cover"
        priority
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,18,28,0.15) 0%, rgba(10,18,28,0.55) 60%, rgba(10,18,28,0.92) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C98A3B] to-transparent" />
    </div>
  );
}

export function FluvialArt({ active }: { active: boolean }) {
  return (
    <div
      className={`relative h-32 w-full overflow-hidden rounded-t-2xl transition-opacity ${
        active ? "opacity-100" : "opacity-60"
      }`}
    >
      <Image
        src="/fluvial.jpg"
        alt="Embarcação em rio da Amazônia"
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        className="object-cover"
        priority
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,18,28,0.15) 0%, rgba(10,18,28,0.55) 60%, rgba(10,18,28,0.92) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#2FB8C6] to-transparent" />
    </div>
  );
}
