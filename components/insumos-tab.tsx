'use client'

import { useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, Field, Input, Modal, SectionTitle } from '@/components/ui/kit'
import { useStore } from '@/lib/store'
import { formatMoney } from '@/lib/calc'
import type { Insumo } from '@/lib/types'

const vazio = { nome: '', valorUnitario: 0, pesoUnitario: 0, ondeCompra: '' }

export function InsumosTab() {
  const { insumos, addInsumo, updateInsumo, removeInsumo, receitas } = useStore()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Insumo, 'id'>>(vazio)

  const abrirNovo = () => {
    setEditId(null)
    setForm(vazio)
    setOpen(true)
  }
  const abrirEdicao = (i: Insumo) => {
    setEditId(i.id)
    setForm({
      nome: i.nome,
      valorUnitario: i.valorUnitario,
      pesoUnitario: i.pesoUnitario ?? 0,
      ondeCompra: i.ondeCompra,
    })
    setOpen(true)
  }

  const salvar = () => {
    if (!form.nome.trim()) return
    if (editId) updateInsumo(editId, form)
    else addInsumo(form)
    setOpen(false)
  }

  const emUso = (id: string) =>
    receitas.some((r) => r.ingredientes.some((ing) => ing.insumoId === id))

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle>Insumos</SectionTitle>
        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          <Plus className="size-4" />
          Adicionar Insumo
        </button>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Cadastre os ingredientes/matérias-primas com seu valor unitário e onde comprar.
      </p>

      {insumos.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Nenhum insumo cadastrado. Clique em{' '}
          <span className="text-primary">Adicionar Insumo</span>.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {insumos.map((i) => (
            <li
              key={i.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/50 p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{i.nome}</p>
                <p className="mt-0.5 font-display text-lg font-bold text-success">
                  {formatMoney(i.valorUnitario)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/ un.</span>
                </p>
                {i.pesoUnitario ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Peso unitário: <span className="text-foreground">{i.pesoUnitario}</span>
                  </p>
                ) : null}
                {i.ondeCompra ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-blue">
                    <MapPin className="size-3.5" />
                    {i.ondeCompra}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Editar"
                  onClick={() => abrirEdicao(i)}
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Remover"
                  onClick={() => {
                    if (emUso(i.id)) {
                      if (
                        !window.confirm(
                          'Este insumo é usado em receitas. Remover mesmo assim?',
                        )
                      )
                        return
                    }
                    removeInsumo(i.id)
                  }}
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Editar Insumo' : 'Novo Insumo'}
      >
        <div className="flex flex-col gap-4">
          <Field label="Nome do insumo" htmlFor="insumo-nome">
            <Input
              id="insumo-nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex.: Carne, Farinha, Refrigerante..."
              autoFocus
            />
          </Field>
          <Field label="Valor unitário ($)" htmlFor="insumo-valor">
            <Input
              id="insumo-valor"
              type="number"
              min={0}
              step="0.01"
              value={form.valorUnitario || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, valorUnitario: Number(e.target.value) }))
              }
              placeholder="0.00"
            />
          </Field>
          <Field label="Peso unitário" htmlFor="insumo-peso">
            <Input
              id="insumo-peso"
              type="number"
              min={0}
              step="0.01"
              value={form.pesoUnitario || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, pesoUnitario: Math.max(0, Number(e.target.value)) }))
              }
              placeholder="0"
            />
          </Field>
          <Field label="Onde comprar" htmlFor="insumo-onde" hint="Loja, mercado ou fornecedor">
            <Input
              id="insumo-onde"
              value={form.ondeCompra}
              onChange={(e) => setForm((f) => ({ ...f, ondeCompra: e.target.value }))}
              placeholder="Ex.: Supermercado central"
            />
          </Field>

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
              disabled={!form.nome.trim()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
