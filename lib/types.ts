export interface Insumo {
  id: string
  nome: string
  valorUnitario: number
  ondeCompra: string
}

export interface Categoria {
  id: string
  nome: string
}

export interface ReceitaIngrediente {
  insumoId: string
  quantidade: number
}

export interface Receita {
  id: string
  nome: string
  categoriaId: string
  rendimento: number
  pesoUnitario: number
  precoMinServidor: number
  precoMaxServidor: number
  precoAtual: number
  ingredientes: ReceitaIngrediente[]
}

export interface CartItem {
  receitaId: string
  quantidade: number
}

export type DescontoTipo = 'valor' | 'porcentagem'
