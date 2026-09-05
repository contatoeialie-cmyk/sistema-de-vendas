'use client'

import { useState } from 'react'
import { ClipboardList, Package, ShoppingCart } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { VendaTab } from '@/components/venda-tab'
import { ReceitasTab } from '@/components/receitas-tab'
import { InsumosTab } from '@/components/insumos-tab'
import type { CartItem } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'venda' | 'receitas' | 'insumos'

const TABS: { id: Tab; label: string; icon: typeof ShoppingCart }[] = [
  { id: 'venda', label: 'Venda', icon: ShoppingCart },
  { id: 'receitas', label: 'Cadastrar Receitas', icon: ClipboardList },
  { id: 'insumos', label: 'Insumos', icon: Package },
]

export default function Page() {
  const [tab, setTab] = useState<Tab>('venda')
  // Carrinho NÃO é persistido (orçamento temporário)
  const [cart, setCart] = useState<CartItem[]>([])

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <nav className="mx-auto my-6 flex w-full max-w-2xl flex-col gap-1.5 rounded-xl border border-border bg-card p-1.5 sm:flex-row">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition',
                tab === id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        {tab === 'venda' && <VendaTab cart={cart} setCart={setCart} />}
        {tab === 'receitas' && <ReceitasTab />}
        {tab === 'insumos' && <InsumosTab />}
      </main>
    </div>
  )
}
