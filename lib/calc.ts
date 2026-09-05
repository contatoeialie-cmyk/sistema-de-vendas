import type { CartItem, Insumo, Receita } from './types'

export function formatMoney(v: number) {
  return `$ ${(Number.isFinite(v) ? v : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatQty(v: number) {
  const r = Math.round(v * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

/** Custo total dos ingredientes de um craft (ciclo). */
export function custoCraft(receita: Receita, insumos: Insumo[]) {
  return receita.ingredientes.reduce((sum, ing) => {
    const insumo = insumos.find((i) => i.id === ing.insumoId)
    return sum + (insumo ? insumo.valorUnitario * ing.quantidade : 0)
  }, 0)
}

/** Custo por unidade produzida. */
export function custoUnitario(receita: Receita, insumos: Insumo[]) {
  const rend = receita.rendimento > 0 ? receita.rendimento : 1
  return custoCraft(receita, insumos) / rend
}

export interface ReceitaExtrato {
  custoIngredientes: number
  receitaLote: number
  lucro: number
  margem: number
  pesoLote: number
}

export function extratoReceita(receita: Receita, insumos: Insumo[]): ReceitaExtrato {
  const custoIngredientes = custoCraft(receita, insumos)
  const receitaLote = receita.precoAtual * receita.rendimento
  const lucro = receitaLote - custoIngredientes
  const margem = receitaLote > 0 ? (lucro / receitaLote) * 100 : 0
  const pesoLote = receita.pesoUnitario * receita.rendimento
  return { custoIngredientes, receitaLote, lucro, margem, pesoLote }
}

export interface IngredienteNecessario {
  insumoId: string
  nome: string
  quantidade: number
  pesoUnitario: number
  pesoTotal: number
}

export interface CartResumo {
  linhas: {
    receita: Receita
    quantidade: number
    unit: number
    total: number
  }[]
  valorTotal: number
  desconto: number
  valorFinal: number
  custoTotal: number
  comissaoPct: number
  comissao: number
  lucroLiquido: number
  ingredientes: IngredienteNecessario[]
}

export function calcularCarrinho(
  cart: CartItem[],
  receitas: Receita[],
  insumos: Insumo[],
  descontoTipo: 'valor' | 'porcentagem',
  descontoValor: number,
  comissaoPct = 0,
): CartResumo {
  const linhas = cart
    .map((item) => {
      const receita = receitas.find((r) => r.id === item.receitaId)
      if (!receita) return null
      return {
        receita,
        quantidade: item.quantidade,
        unit: receita.precoAtual,
        total: receita.precoAtual * item.quantidade,
      }
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)

  const valorTotal = linhas.reduce((s, l) => s + l.total, 0)

  let desconto = 0
  if (descontoTipo === 'porcentagem') {
    desconto = valorTotal * (Math.max(0, descontoValor) / 100)
  } else {
    desconto = Math.max(0, descontoValor)
  }
  desconto = Math.min(desconto, valorTotal)

  const valorFinal = valorTotal - desconto

  const custoTotal = linhas.reduce(
    (s, l) => s + custoUnitario(l.receita, insumos) * l.quantidade,
    0,
  )

  const pct = Math.max(0, comissaoPct)
  const comissao = valorFinal * (pct / 100)
  const lucroLiquido = valorFinal - custoTotal - comissao

  // Ingredientes agregados
  const mapa = new Map<string, IngredienteNecessario>()
  for (const l of linhas) {
    for (const ing of l.receita.ingredientes) {
      const insumo = insumos.find((i) => i.id === ing.insumoId)
      const nome = insumo ? insumo.nome : 'Insumo removido'
      const pesoUnitario = insumo?.pesoUnitario ?? 0
      const qtd = ing.quantidade * l.quantidade
      const existente = mapa.get(ing.insumoId)
      if (existente) {
        existente.quantidade += qtd
        existente.pesoTotal += qtd * existente.pesoUnitario
      } else {
        mapa.set(ing.insumoId, {
          insumoId: ing.insumoId,
          nome,
          quantidade: qtd,
          pesoUnitario,
          pesoTotal: qtd * pesoUnitario,
        })
      }
    }
  }

  return {
    linhas,
    valorTotal,
    desconto,
    valorFinal,
    custoTotal,
    comissaoPct: pct,
    comissao,
    lucroLiquido,
    ingredientes: Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome)),
  }
}
