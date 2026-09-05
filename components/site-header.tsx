import Image from 'next/image'

export function SiteHeader() {
  return (
    <header className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[#2a0f1e] via-[#1a0a12] to-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(236,72,153,0.28), transparent 55%), radial-gradient(circle at 15% 80%, rgba(56,189,248,0.18), transparent 50%)',
        }}
      />
      <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-6">
        <Image
          src="/logo-sistema-vendas.png"
          alt="Sistema de Vendas"
          width={1512}
          height={1000}
          priority
          className="h-auto w-full max-w-[440px] drop-shadow-[0_8px_24px_rgba(236,72,153,0.35)]"
        />
      </div>
    </header>
  )
}
