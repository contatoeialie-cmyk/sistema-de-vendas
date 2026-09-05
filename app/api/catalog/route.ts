import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, recipeIngredients, recipes, supplies } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

const numberOrNull = (value: unknown) => value === null || value === undefined || value === '' ? null : Number(value)
const integer = (value: unknown, fallback = 0) => Math.max(0, Math.trunc(Number(value) || fallback))

export async function GET() {
  const [categoryRows, supplyRows, recipeRows, ingredientRows] = await Promise.all([
    db.select().from(categories),
    db.select().from(supplies),
    db.select().from(recipes),
    db.select().from(recipeIngredients),
  ])
  return NextResponse.json({
    categorias: categoryRows.map((row) => ({ id: row.id, nome: row.name })),
    insumos: supplyRows.map((row) => ({ id: row.id, nome: row.name, valorUnitario: Number(row.unitPrice), pesoUnitario: row.unitWeight ? Number(row.unitWeight) : 0, ondeCompra: row.whereToBuy })),
    receitas: recipeRows.map((row) => ({ id: row.id, nome: row.name, categoriaId: row.categoryId, precoAtual: Number(row.salePrice), rendimento: row.yieldQuantity, pesoUnitario: row.unitWeight ? Number(row.unitWeight) : 0, faixaServidorMin: row.serverMin ? Number(row.serverMin) : 0, faixaServidorMax: row.serverMax ? Number(row.serverMax) : 0, ingredientes: ingredientRows.filter((item) => item.recipeId === row.id).map((item) => ({ insumoId: item.supplyId, quantidade: item.quantity })) })),
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const action = body.action as string
  if (action === 'category.create') await db.insert(categories).values({ id: body.data.id, name: body.data.nome })
  if (action === 'category.update') await db.update(categories).set({ name: body.data.nome }).where(eq(categories.id, body.data.id))
  if (action === 'category.delete') await db.delete(categories).where(eq(categories.id, body.data.id))
  if (action === 'supply.create' || action === 'supply.update') {
    const data = { id: body.data.id, name: body.data.nome, unitPrice: String(Number(body.data.valorUnitario) || 0), unitWeight: numberOrNull(body.data.pesoUnitario)?.toString() ?? null, whereToBuy: body.data.ondeCompra || '' }
    if (action.endsWith('create')) await db.insert(supplies).values(data)
    else await db.update(supplies).set(data).where(eq(supplies.id, data.id))
  }
  if (action === 'supply.delete') await db.delete(supplies).where(eq(supplies.id, body.data.id))
  if (action === 'recipe.create' || action === 'recipe.update') {
    const d = body.data
    const recipe = { id: d.id, name: d.nome, categoryId: d.categoriaId, salePrice: String(Number(d.precoAtual) || 0), yieldQuantity: integer(d.rendimento, 1), unitWeight: numberOrNull(d.pesoUnitario)?.toString() ?? null, serverMin: numberOrNull(d.faixaServidorMin)?.toString() ?? null, serverMax: numberOrNull(d.faixaServidorMax)?.toString() ?? null }
    if (action.endsWith('create')) await db.insert(recipes).values(recipe)
    else await db.update(recipes).set(recipe).where(eq(recipes.id, recipe.id))
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipe.id))
    if (d.ingredientes?.length) await db.insert(recipeIngredients).values(d.ingredientes.map((item: { insumoId: string; quantidade: number }) => ({ recipeId: recipe.id, supplyId: item.insumoId, quantity: integer(item.quantidade) })))
  }
  if (action === 'recipe.delete') {
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, body.data.id))
    await db.delete(recipes).where(eq(recipes.id, body.data.id))
  }
  return NextResponse.json({ ok: true })
}
