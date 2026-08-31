import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ------- Medicines index.tsx structural tests -------

describe('MedicineList — component structure', () => {
  it('medicines/index.tsx does not contain where(manualStatus) pattern', () => {
    const src = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')
    expect(src).not.toMatch(/where\s*\(\s*['"]manualStatus['"]/)
  })
})

// ------- Dashboard and Trash stub routes -------

describe('Route stubs — dashboard and trash', () => {
  it('DashboardScreen is exported from routes/dashboard/index', async () => {
    const mod = await import('../dashboard/index')
    expect(typeof mod.DashboardScreen).toBe('function')
  })

  it('TrashScreen is exported from routes/trash/index', async () => {
    const mod = await import('../trash/index')
    expect(typeof mod.TrashScreen).toBe('function')
  })
})

// ------- BottomTabBar structural tests -------

describe('BottomTabBar — 4 tabs', () => {
  it('BottomTabBar exports BottomTabBar function', async () => {
    const mod = await import('../../components/BottomTabBar')
    expect(typeof mod.BottomTabBar).toBe('function')
  })
})
