'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Categoria, Insumo, Receita } from './types'

const KEYS = {
  categorias: 'sv:categorias',
  insumos: 'sv:insumos',
  receitas: 'sv:receitas',
} as const

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

interface StoreValue {
  ready: boolean
  categorias: Categoria[]
  insumos: Insumo[]
  receitas: Receita[]
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

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])

  useEffect(() => {
    setCategorias(load<Categoria[]>(KEYS.categorias, []))
    setInsumos(load<Insumo[]>(KEYS.insumos, []))
    setReceitas(load<Receita[]>(KEYS.receitas, []))
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) window.localStorage.setItem(KEYS.categorias, JSON.stringify(categorias))
  }, [categorias, ready])
  useEffect(() => {
    if (ready) window.localStorage.setItem(KEYS.insumos, JSON.stringify(insumos))
  }, [insumos, ready])
  useEffect(() => {
    if (ready) window.localStorage.setItem(KEYS.receitas, JSON.stringify(receitas))
  }, [receitas, ready])

  const addCategoria = useCallback((nome: string) => {
    const cat: Categoria = { id: uid(), nome: nome.trim() }
    setCategorias((prev) => [...prev, cat])
    return cat
  }, [])

  const updateCategoria = useCallback((id: string, nome: string) => {
    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, nome: nome.trim() } : c)))
  }, [])

  const removeCategoria = useCallback((id: string) => {
    setCategorias((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addInsumo = useCallback((data: Omit<Insumo, 'id'>) => {
    setInsumos((prev) => [...prev, { ...data, id: uid() }])
  }, [])
  const updateInsumo = useCallback((id: string, data: Omit<Insumo, 'id'>) => {
    setInsumos((prev) => prev.map((i) => (i.id === id ? { ...data, id } : i)))
  }, [])
  const removeInsumo = useCallback((id: string) => {
    setInsumos((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const addReceita = useCallback((data: Omit<Receita, 'id'>) => {
    setReceitas((prev) => [...prev, { ...data, id: uid() }])
  }, [])
  const updateReceita = useCallback((id: string, data: Omit<Receita, 'id'>) => {
    setReceitas((prev) => prev.map((r) => (r.id === id ? { ...data, id } : r)))
  }, [])
  const removeReceita = useCallback((id: string) => {
    setReceitas((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      categorias,
      insumos,
      receitas,
      addCategoria,
      updateCategoria,
      removeCategoria,
      addInsumo,
      updateInsumo,
      removeInsumo,
      addReceita,
      updateReceita,
      removeReceita,
    }),
    [
      ready,
      categorias,
      insumos,
      receitas,
      addCategoria,
      updateCategoria,
      removeCategoria,
      addInsumo,
      updateInsumo,
      removeInsumo,
      addReceita,
      updateReceita,
      removeReceita,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve ser usado dentro de StoreProvider')
  return ctx
}
