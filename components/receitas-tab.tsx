'use client'

import { useMemo, useState } from 'react'
  import { Check, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { Card, Field, Input, Modal, SectionTitle, Select } from '@/components/ui/kit'
import { useStore } from '@/lib/store'
import { extratoReceita, formatMoney, formatQty } from '@/lib/calc'
import type { Receita, ReceitaIngrediente } from '@/lib/types'

interface FormState {
  nome: string
  categoriaId: string
  rendimento: number
  pesoUnitario: number
  precoMinServidor: number
  precoMaxServidor: number
  precoAtual: number
  ingredientes: ReceitaIngrediente[]
}

const vazio: FormState = {
  nome: '',
  categoriaId: '',
  rendimento: 1,
  pesoUnitario: 0,
  precoMinServidor: 0,
  precoMaxServidor: 0,
  precoAtual: 0,
  ingredientes: [],
}

export function ReceitasTab() {
  const {
    receitas,
    categorias,
    insumos,
    addCategoria,
    updateCategoria,
    removeCategoria,
    addReceita,
    updateReceita,
    removeReceita,
  } = useStore()

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(vazio)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCatNome, setEditCatNome] = useState('')

  const iniciarEdicaoCategoria = (id: string, nome: string) => {
    setEditCatId(id)
    setEditCatNome(nome)
  }
  const salvarEdicaoCategoria = () => {
    if (editCatId && editCatNome.trim()) updateCategoria(editCatId, editCatNome)
    setEditCatId(null)
    setEditCatNome('')
  }
  const removerCategoria = (id: string, nome: string) => {
    const usada = receitas.some((r) => r.categoriaId === id)
    const msg = usada
      ? `A categoria "${nome}" possui receitas vinculadas. Remover mesmo assim?`
      : `Remover a categoria "${nome}"?`
    if (window.confirm(msg)) removeCategoria(id)
  }

  const abrirNovo = () => {
    setEditId(null)
    setForm({ ...vazio, categoriaId: categorias[0]?.id ?? '' })
    setOpen(true)
  }
  const abrirEdicao = (r: Receita) => {
    setEditId(r.id)
    setForm({
      nome: r.nome,
      categoriaId: r.categoriaId,
      rendimento: r.rendimento,
      pesoUnitario: r.pesoUnitario,
      precoMinServidor: r.precoMinServidor,
      precoMaxServidor: r.precoMaxServidor,
      precoAtual: r.precoAtual,
      ingredientes: r.ingredientes.map((i) => ({ ...i })),
    })
    setOpen(true)
  }

  const salvar = () => {
    if (!form.nome.trim() || !form.categoriaId) return
    const payload = { ...form, nome: form.nome.trim() }
    if (editId) updateReceita(editId, payload)
    else addReceita(payload)
    setOpen(false)
  }

  const addIngredienteRow = () => {
    if (!insumos.length) return
    setForm((f) => ({
      ...f,
      ingredientes: [...f.ingredientes, { insumoId: insumos[0].id, quantidade: 1 }],
    }))
  }
  const updateIngrediente = (idx: number, patch: Partial<ReceitaIngrediente>) =>
    setForm((f) => ({
      ...f,
      ingredientes: f.ingredientes.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)),
    }))
  const removeIngredienteRow = (idx: number) =>
    setForm((f) => ({ ...f, ingredientes: f.ingredientes.filter((_, i) => i !== idx) }))

  const criarCategoria = () => {
    const nome = novaCategoria.trim()
    if (!nome) return
    const cat = addCategoria(nome)
    setForm((f) => ({ ...f, categoriaId: f.categoriaId || cat.id }))
    setNovaCategoria('')
  }

  const extratoForm = useMemo(() => {
    const custo = form.ingredientes.reduce((s, ing) => {
      const ins = insumos.find((i) => i.id === ing.insumoId)
      return s + (ins ? ins.valorUnitario * ing.quantidade : 0)
    }, 0)
    const receitaLote = form.precoAtual * form.rendimento
    const lucro = receitaLote - custo
    const margem = receitaLote > 0 ? (lucro / receitaLote) * 100 : 0
    return { custo, receitaLote, lucro, margem, pesoLote: form.pesoUnitario * form.rendimento }
  }, [form, insumos])

  const porCategoria = useMemo(() => {
    return categorias
      .map((c) => ({ categoria: c, itens: receitas.filter((r) => r.categoriaId === c.id) }))
      .filter((g) => g.itens.length > 0)
  }, [categorias, receitas])

  return (
    <div className="flex flex-col gap-6">
      {/* Categorias */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Tag className="size-5 text-blue" />
          <h2 className="font-display text-lg font-bold tracking-wide text-blue uppercase">
            Categorias
          </h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categorias.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma categoria criada ainda.</p>
          )}
          {categorias.map((c) => {
            if (editCatId === c.id) {
              return (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-pink/50 bg-pink/10 px-2 py-1 text-sm"
                >
                  <Input
                    value={editCatNome}
                    onChange={(e) => setEditCatNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) salvarEdicaoCategoria()
                      if (e.key === 'Escape') setEditCatId(null)
                    }}
                    autoFocus
                    className="h-7 w-40 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    aria-label="Salvar categoria"
                    onClick={salvarEdicaoCategoria}
                    className="text-success transition hover:brightness-110"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Cancelar edição"
                    onClick={() => setEditCatId(null)}
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              )
            }
            return (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue/40 bg-blue/10 px-3 py-1 text-sm text-foreground"
              >
                {c.nome}
                <button
                  type="button"
                  aria-label={`Editar categoria ${c.nome}`}
                  onClick={() => iniciarEdicaoCategoria(c.id, c.nome)}
                  className="text-muted-foreground transition hover:text-pink"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Remover categoria ${c.nome}`}
                  onClick={() => removerCategoria(c.id, c.nome)}
                  className="text-muted-foreground transition hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            )
          })}
        </div>
        <div className="mt-4 flex max-w-md gap-2">
          <Input
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) criarCategoria()
            }}
            placeholder="Nova categoria (ex.: Boxes, Bebidas...)"
          />
          <button
            type="button"
            onClick={criarCategoria}
            disabled={!novaCategoria.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue px-4 py-2.5 text-sm font-semibold text-blue-foreground transition hover:brightness-105 disabled:opacity-40"
          >
            <Plus className="size-4" />
            Criar
          </button>
        </div>
      </Card>

      {/* Receitas */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>Receitas</SectionTitle>
          <button
            type="button"
            onClick={abrirNovo}
            disabled={categorias.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
            title={categorias.length === 0 ? 'Crie uma categoria primeiro' : undefined}
          >
            <Plus className="size-4" />
            Adicionar Receita
          </button>
        </div>

        {receitas.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Nenhuma receita cadastrada.{' '}
            {categorias.length === 0
              ? 'Crie uma categoria acima para começar.'
              : 'Clique em Adicionar Receita.'}
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-6">
            {porCategoria.map(({ categoria, itens }) => (
              <div key={categoria.id}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-blue uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                  {categoria.nome}
                </h3>
                <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {itens.map((r) => {
                    const ex = extratoReceita(r, insumos)
                    return (
                      <li
                        key={r.id}
                        className="rounded-xl border border-border bg-background/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{r.nome}</p>
                            <p className="font-display text-xl font-bold text-success">
                              {formatMoney(r.precoAtual)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              aria-label="Editar"
                              onClick={() => abrirEdicao(r)}
                              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Remover"
                              onClick={() => removeReceita(r.id)}
                              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <Metric label="Custo insumos" value={formatMoney(ex.custoIngredientes)} />
                          <Metric
                            label="Lucro / lote"
                            value={formatMoney(ex.lucro)}
                            tone={ex.lucro >= 0 ? 'green' : 'pink'}
                          />
                          <Metric
                            label="Margem"
                            value={`${ex.margem.toFixed(1)}%`}
                            tone={ex.margem >= 0 ? 'green' : 'pink'}
                          />
                          <Metric label="Rendimento" value={`${formatQty(r.rendimento)} un.`} />
                          <Metric label="Peso do lote" value={`${formatQty(ex.pesoLote)}`} />
                          <Metric
                            label="Faixa servidor"
                            value={`${formatMoney(r.precoMinServidor)} – ${formatMoney(r.precoMaxServidor)}`}
                          />
                        </dl>

                        {r.ingredientes.length > 0 && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            <span className="text-blue">Ingredientes:</span>{' '}
                            {r.ingredientes
                              .map((ing) => {
                                const ins = insumos.find((i) => i.id === ing.insumoId)
                                return `${ins?.nome ?? '?'} (${formatQty(ing.quantidade)})`
                              })
                              .join(', ')}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Receita */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Editar Receita' : 'Nova Receita'}
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome da receita" htmlFor="rec-nome">
              <Input
                id="rec-nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex.: Box P, Burger Duplo..."
                autoFocus
              />
            </Field>
            <Field label="Categoria" htmlFor="rec-cat">
              <Select
                id="rec-cat"
                value={form.categoriaId}
                onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Preço de venda ($)" htmlFor="rec-preco">
              <Input
                id="rec-preco"
                type="number"
                min={0}
                step="0.01"
                value={form.precoAtual || ''}
                onChange={(e) => setForm((f) => ({ ...f, precoAtual: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </Field>
            <Field label="Rendimento (un.)" htmlFor="rec-rend">
              <Input
                id="rec-rend"
                type="number"
                min={1}
                value={form.rendimento || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rendimento: Math.max(1, Number(e.target.value)) }))
                }
              />
            </Field>
            <Field label="Peso unitário" htmlFor="rec-peso">
              <Input
                id="rec-peso"
                type="number"
                min={0}
                step="0.01"
                value={form.pesoUnitario || ''}
                onChange={(e) => setForm((f) => ({ ...f, pesoUnitario: Number(e.target.value) }))}
                placeholder="0"
              />
            </Field>
            <Field label="Preço mín. servidor ($)" htmlFor="rec-min">
              <Input
                id="rec-min"
                type="number"
                min={0}
                step="0.01"
                value={form.precoMinServidor || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, precoMinServidor: Number(e.target.value) }))
                }
                placeholder="0.00"
              />
            </Field>
            <Field label="Preço máx. servidor ($)" htmlFor="rec-max">
              <Input
                id="rec-max"
                type="number"
                min={0}
                step="0.01"
                value={form.precoMaxServidor || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, precoMaxServidor: Number(e.target.value) }))
                }
                placeholder="0.00"
              />
            </Field>
          </div>

          {/* Categoria inline */}
          <div className="rounded-lg border border-dashed border-border p-3">
            <p className="mb-2 text-xs text-muted-foreground">Criar nova categoria rapidamente</p>
            <div className="flex gap-2">
              <Input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    criarCategoria()
                  }
                }}
                placeholder="Nome da categoria"
                className="h-9"
              />
              <button
                type="button"
                onClick={criarCategoria}
                disabled={!novaCategoria.trim()}
                className="shrink-0 rounded-lg bg-blue px-3 py-2 text-sm font-semibold text-blue-foreground transition hover:brightness-105 disabled:opacity-40"
              >
                Criar
              </button>
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Ingredientes</p>
              <button
                type="button"
                onClick={addIngredienteRow}
                disabled={!insumos.length}
                className="inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-gold-foreground transition hover:brightness-105 disabled:opacity-40"
              >
                <Plus className="size-3.5" />
                Adicionar
              </button>
            </div>
            {!insumos.length ? (
              <p className="text-xs text-muted-foreground">
                Cadastre insumos na aba Insumos para adicioná-los às receitas.
              </p>
            ) : form.ingredientes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum ingrediente adicionado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {form.ingredientes.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Select
                      value={ing.insumoId}
                      onChange={(e) => updateIngrediente(idx, { insumoId: e.target.value })}
                      className="h-9 flex-1"
                    >
                      {insumos.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nome} ({formatMoney(i.valorUnitario)})
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={ing.quantidade || ''}
                      onKeyDown={(e) => {
                        if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
                      }}
                      onChange={(e) =>
                        updateIngrediente(idx, {
                          quantidade: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                        })
                      }
                      className="h-9 w-24"
                      placeholder="Qtd"
                    />
                    <button
                      type="button"
                      aria-label="Remover ingrediente"
                      onClick={() => removeIngredienteRow(idx)}
                      className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Extrato */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background/50 p-4 sm:grid-cols-4">
            <Metric label="Custo insumos" value={formatMoney(extratoForm.custo)} />
            <Metric
              label="Receita / lote"
              value={formatMoney(extratoForm.receitaLote)}
              tone="pink"
            />
            <Metric
              label="Lucro / lote"
              value={formatMoney(extratoForm.lucro)}
              tone={extratoForm.lucro >= 0 ? 'green' : 'pink'}
            />
            <Metric
              label="Margem"
              value={`${extratoForm.margem.toFixed(1)}%`}
              tone={extratoForm.margem >= 0 ? 'green' : 'pink'}
            />
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={!form.nome.trim() || !form.categoriaId}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'pink' | 'green'
}) {
  const cls =
    tone === 'pink'
      ? 'text-primary'
      : tone === 'green'
        ? 'text-success'
        : 'text-foreground'
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={`font-semibold ${cls}`}>{value}</dd>
    </div>
  )
}
