'use client'

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { FileText, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Card, Input, SectionTitle } from '@/components/ui/kit'
import { useStore } from '@/lib/store'
import { calcularCarrinho, formatMoney, formatQty } from '@/lib/calc'
import { gerarRelatorioPDF } from '@/lib/pdf'
import type { CartItem, DescontoTipo } from '@/lib/types'
import { cn } from '@/lib/utils'

export function VendaTab({
  cart,
  setCart,
}: {
  cart: CartItem[]
  setCart: Dispatch<SetStateAction<CartItem[]>>
}) {
  const { receitas, categorias, insumos } = useStore()
  const [quantidades, setQuantidades] = useState<Record<string, number>>({})
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas')
  const [descontoTipo, setDescontoTipo] = useState<DescontoTipo>('valor')
  const [descontoValor, setDescontoValor] = useState<number>(0)
  const [gerando, setGerando] = useState(false)

  const categoriasComProdutos = useMemo(
    () => categorias.filter((c) => receitas.some((r) => r.categoriaId === c.id)),
    [categorias, receitas],
  )

  const receitasFiltradas = useMemo(() => {
    if (categoriaAtiva === 'todas') return receitas
    return receitas.filter((r) => r.categoriaId === categoriaAtiva)
  }, [receitas, categoriaAtiva])

  const setQtd = (id: string, v: number) =>
    setQuantidades((prev) => ({ ...prev, [id]: Math.max(0, v) }))

  const adicionar = (receitaId: string, qtd: number) => {
    if (qtd <= 0) return
    setCart((prev) => {
      const existente = prev.find((c) => c.receitaId === receitaId)
      if (existente) {
        return prev.map((c) =>
          c.receitaId === receitaId ? { ...c, quantidade: c.quantidade + qtd } : c,
        )
      }
      return [...prev, { receitaId, quantidade: qtd }]
    })
    setQtd(receitaId, 0)
  }

  const adicionarTodos = () => {
    const pendentes = Object.entries(quantidades).filter(([, q]) => q > 0)
    if (!pendentes.length) return
    setCart((prev) => {
      const map = new Map(prev.map((c) => [c.receitaId, c.quantidade]))
      for (const [id, q] of pendentes) map.set(id, (map.get(id) ?? 0) + q)
      return Array.from(map, ([receitaId, quantidade]) => ({ receitaId, quantidade }))
    })
    setQuantidades({})
  }

  const resumo = useMemo(
    () => calcularCarrinho(cart, receitas, insumos, descontoTipo, descontoValor),
    [cart, receitas, insumos, descontoTipo, descontoValor],
  )

  const handlePDF = async () => {
    setGerando(true)
    try {
      await gerarRelatorioPDF(resumo)
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      {/* ---------- Cardápio ---------- */}
      <Card className="p-5">
        <SectionTitle>Produtos</SectionTitle>

        {receitas.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Nenhuma receita cadastrada ainda. Vá até a aba{' '}
            <span className="text-primary">Cadastrar Receitas</span> para começar.
          </p>
        ) : (
          <>
            {/* Sub-abas de categoria */}
            <div className="mt-4 flex flex-wrap gap-1.5 border-b border-border pb-3">
              <CategoriaChip
                label="Todas"
                active={categoriaAtiva === 'todas'}
                onClick={() => setCategoriaAtiva('todas')}
              />
              {categoriasComProdutos.map((c) => (
                <CategoriaChip
                  key={c.id}
                  label={c.nome}
                  active={categoriaAtiva === c.id}
                  onClick={() => setCategoriaAtiva(c.id)}
                />
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={adicionarTodos}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground transition hover:brightness-105"
              >
                <ShoppingCart className="size-4" />
                Adicionar Todos
              </button>
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {receitasFiltradas.map((r) => {
                const cat = categorias.find((c) => c.id === r.categoriaId)
                const qtd = quantidades[r.id] ?? 0
                return (
                  <li
                    key={r.id}
                    className="rounded-xl border border-border bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-[140px]">
                        <p className="font-semibold text-foreground">{r.nome}</p>
                        {cat ? (
                          <span className="text-xs text-blue">{cat.nome}</span>
                        ) : null}
                        <p className="mt-1 font-display text-lg font-bold text-success">
                          {formatMoney(r.precoAtual)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-input">
                          <button
                            type="button"
                            aria-label="Diminuir"
                            onClick={() => setQtd(r.id, qtd - 1)}
                            className="grid size-9 place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Minus className="size-4" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={qtd}
                            onChange={(e) => setQtd(r.id, Number(e.target.value))}
                            className="h-9 w-14 border-x border-input bg-background text-center text-sm outline-none"
                          />
                          <button
                            type="button"
                            aria-label="Aumentar"
                            onClick={() => setQtd(r.id, qtd + 1)}
                            className="grid size-9 place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => adicionar(r.id, qtd)}
                          disabled={qtd <= 0}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-gold-foreground transition hover:brightness-105 disabled:opacity-40"
                        >
                          <Plus className="size-4" />
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      {/* ---------- Carrinho ---------- */}
      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <SectionTitle>Carrinho</SectionTitle>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/15 px-2.5 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/25"
              >
                <Trash2 className="size-3.5" />
                Limpar Tudo
              </button>
            )}
          </div>

          {resumo.linhas.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Itens selecionados para venda aparecerão aqui.
            </p>
          ) : (
            <>
              <ul className="mt-4 flex flex-col gap-2">
                {resumo.linhas.map((l) => (
                  <li
                    key={l.receita.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{l.receita.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatQty(l.quantidade)} × {formatMoney(l.unit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-success">
                        {formatMoney(l.total)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remover ${l.receita.nome}`}
                        onClick={() =>
                          setCart((prev) =>
                            prev.filter((c) => c.receitaId !== l.receita.id),
                          )
                        }
                        className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desconto */}
              <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Desconto</p>
                <div className="flex gap-2">
                  <div className="flex overflow-hidden rounded-lg border border-input text-xs">
                    <button
                      type="button"
                      onClick={() => setDescontoTipo('valor')}
                      className={cn(
                        'px-3 py-2 font-medium transition',
                        descontoTipo === 'valor'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescontoTipo('porcentagem')}
                      className={cn(
                        'px-3 py-2 font-medium transition',
                        descontoTipo === 'porcentagem'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      %
                    </button>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={descontoValor || ''}
                    onChange={(e) => setDescontoValor(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
              </div>

              {/* Resumo Financeiro */}
              <dl className="mt-4 flex flex-col gap-1.5 text-sm">
                <ResumoLinha label="Valor Total" valor={formatMoney(resumo.valorTotal)} />
                <ResumoLinha
                  label="Desconto"
                  valor={`- ${formatMoney(resumo.desconto)}`}
                  tone="muted"
                />
                <ResumoLinha
                  label="Valor Final"
                  valor={formatMoney(resumo.valorFinal)}
                  tone="pink"
                />
                <div className="my-1 border-t border-dashed border-border" />
                <ResumoLinha
                  label="Custo Total"
                  valor={formatMoney(resumo.custoTotal)}
                  tone="muted"
                />
                <ResumoLinha
                  label="Comissão (40%)"
                  valor={`- ${formatMoney(resumo.comissao)}`}
                  tone="muted"
                />
                <ResumoLinha
                  label="Lucro Líquido"
                  valor={formatMoney(resumo.lucroLiquido)}
                  tone="green"
                />
              </dl>

              <button
                type="button"
                onClick={handlePDF}
                disabled={gerando}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue px-4 py-3 text-sm font-semibold text-blue-foreground transition hover:brightness-105 disabled:opacity-50"
              >
                <FileText className="size-4" />
                {gerando ? 'Gerando...' : 'Gerar PDF do Relatório'}
              </button>
            </>
          )}
        </Card>

        {/* Ingredientes Necessários */}
        {resumo.ingredientes.length > 0 && (
          <Card className="p-5">
            <h3 className="font-display text-lg font-bold tracking-wide text-blue uppercase">
              Ingredientes Necessários
            </h3>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Ingrediente</th>
                  <th className="pb-2 text-right font-medium">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {resumo.ingredientes.map((i) => (
                  <tr key={i.insumoId} className="border-b border-border/50 last:border-0">
                    <td className="py-2">{i.nome}</td>
                    <td className="py-2 text-right font-semibold text-foreground">
                      {formatQty(i.quantidade)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  )
}

function CategoriaChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium transition',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

function ResumoLinha({
  label,
  valor,
  tone = 'default',
}: {
  label: string
  valor: string
  tone?: 'default' | 'muted' | 'pink' | 'green'
}) {
  const valorClass =
    tone === 'pink'
      ? 'text-primary font-bold text-base'
      : tone === 'green'
        ? 'text-success font-bold text-base'
        : tone === 'muted'
          ? 'text-muted-foreground'
          : 'text-foreground font-medium'
  return (
    <div className="flex items-center justify-between">
      <dt className={cn('text-muted-foreground', (tone === 'pink' || tone === 'green') && 'text-foreground font-medium')}>
        {label}
      </dt>
      <dd className={valorClass}>{valor}</dd>
    </div>
  )
}
