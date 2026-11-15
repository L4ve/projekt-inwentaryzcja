import assert from 'node:assert/strict'
import test from 'node:test'
import { validateItem } from './validation.js'

test('validateItem akceptuje prawidłowy numer inwentarzowy i nieujemną cenę', () => {
  assert.equal(validateItem({ inventory_number: 'INV-001', purchase_price: 0 }), null)
  assert.equal(validateItem({ inventory_number: ' INV-001 ', purchase_price: '12.50' }), null)
})

test('validateItem odrzuca nieprawidłowe numery inwentarzowe', () => {
  for (const inventory_number of ['', '   ', '-INV-001', 'INV/001', 'x'.repeat(101), 123]) {
    assert.equal(
      validateItem({ inventory_number, purchase_price: null }),
      'Numer inwentarzowy ma nieprawidłowy format',
    )
  }
})

test('validateItem akceptuje brakującą lub pustą cenę zakupu', () => {
  assert.equal(validateItem({ inventory_number: 'INV-001', purchase_price: null }), null)
  assert.equal(validateItem({ inventory_number: 'INV-001' }), null)
})

test('validateItem odrzuca ujemne i nieprawidłowe ceny zakupu', () => {
  for (const purchase_price of [-0.01, '-1', 'not-a-price', Infinity, NaN]) {
    assert.equal(
      validateItem({ inventory_number: 'INV-001', purchase_price }),
      'Cena zakupu nie może być cyfrą ujemną.',
    )
  }
})
