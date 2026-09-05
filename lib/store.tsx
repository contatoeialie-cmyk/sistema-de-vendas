'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import type { CartItem, Categoria, Insumo, Receita } from './types'

type Catalog = { categorias: Categoria[]; insumos: Insumo[]; receitas: Receita[] }
interface StoreValue extends Catalog {
  ready: boolean
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  addCategoria: (nome: string) => Categoria
  updateCategoria: (id: string, nome: string) => void
  removeCategoria: (id: string) => void
  addInsumo: (data: Omit<Insumo, 'id'>) => void
  updateInsumo: (id: string, data: Omit<Insumo, 'id'>) => void
  removeInsumo: (id: string) => void
  addReceita: (data: Omit<Receita, 'id'>) => void
  updateReceita: (id: string, data: Omit<Receita, 'id'>) => void
  removeReceita: (id: string) => void
}

const empty: Catalog = { categorias: [], insumos: [], receitas: [] }
const fetcher = (url: string) => fetch(url).then((res) => res.json())
export function uid() { return crypto.randomUUID() }

async function persist(action: string, data: unknown) {
  const res = await fetch('/api/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, data }) })
  if (!res.ok) throw new Error('Não foi possível salvar no Neon')
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data, mutate } = useSWR<Catalog>('/api/catalog', fetcher, { revalidateOnFocus: true })
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartReady, setCartReady] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('sv:cart')
      if (saved) setCart(JSON.parse(saved))
    } catch { /* carrinho corrompido é ignorado */ }
    setCartReady(true)
  }, [])
  useEffect(() => {
    if (cartReady) window.localStorage.setItem('sv:cart', JSON.stringify(cart))
  }, [cart, cartReady])

  const change = useCallback(async (action: string, item: unknown) => {
    await persist(action, item)
    await mutate()
  }, [mutate])

  const addCategoria = useCallback((nome: string) => { const item = { id: uid(), nome: nome.trim() }; void change('category.create', item); return item }, [change])
  const updateCategoria = useCallback((id: string, nome: string) => void change('category.update', { id, nome: nome.trim() }), [change])
  const removeCategoria = useCallback((id: string) => void change('category.delete', { id }), [change])
  const addInsumo = useCallback((data: Omit<Insumo, 'id'>) => { const item = { ...data, id: uid() }; void change('supply.create', item) }, [change])
  const updateInsumo = useCallback((id: string, data: Omit<Insumo, 'id'>) => void change('supply.update', { ...data, id }), [change])
  const removeInsumo = useCallback((id: string) => void change('supply.delete', { id }), [change])
  const addReceita = useCallback((data: Omit<Receita, 'id'>) => { const item = { ...data, id: uid() }; void change('recipe.create', item) }, [change])
  const updateReceita = useCallback((id: string, data: Omit<Receita, 'id'>) => void change('recipe.update', { ...data, id }), [change])
  const removeReceita = useCallback((id: string) => void change('recipe.delete', { id }), [change])

  const value = useMemo<StoreValue>(() => ({ ...(data ?? empty), ready: Boolean(data) && cartReady, cart, setCart, addCategoria, updateCategoria, removeCategoria, addInsumo, updateInsumo, removeInsumo, addReceita, updateReceita, removeReceita }), [data, cart, cartReady, addCategoria, updateCategoria, removeCategoria, addInsumo, updateInsumo, removeInsumo, addReceita, updateReceita, removeReceita])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve ser usado dentro de StoreProvider')
  return ctx
}
