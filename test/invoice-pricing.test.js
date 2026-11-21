var test = require('node:test');
var assert = require('node:assert/strict');

var pricing = require('../lib/pricing');
var tax = require('../lib/tax');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');

test('order pricing applies the HSN rate after discount and splits GST', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 }];
  var totals = pricing.computeTotals(items, '');

  assert.deepEqual(totals, {
    subtotal: 200,
    discount: 0,
    taxable: 200,
    tax: 10,
    cgst: 5,
    sgst: 5,
    total: 210,
    lines: [{
      id: 1,
      name: 'Rice',
      hsn: '1006',
      gstPercent: 5,
      gross: 200,
      discount: 0,
      taxable: 200,
      tax: 10,
      net: 210
    }]
  });
});

test('invoice uses the checkout HSN rate and matches checkout totals', function () {
  var order = {
    items: [{ id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 2 }]
  };
  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(tax.getRateForItem(order.items[0]), 0.05);
  assert.equal(figures.tax, 10);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.cgst, 5);
  assert.equal(figures.sgst, 5);
  assert.equal(figures.total, 210);
});

test('invoice applies percentage coupon to subtotal and calculates GST after discount', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 1000, qty: 1 }];
  var order = {
    coupon: 'SAVE10',
    items: items
  };
  var ledgerTotals = pricing.computeTotals(items, order.coupon);
  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(ledgerTotals.discount, 100);
  assert.equal(ledgerTotals.tax, 45);
  assert.equal(ledgerTotals.total, 945);
  assert.equal(invoiceFigures.discount, ledgerTotals.discount);
  assert.equal(invoiceFigures.tax, ledgerTotals.tax);
  assert.equal(invoiceFigures.total, ledgerTotals.total);
  assert.equal(invoiceFigures.total, 945);
});

test('invoice coupon calculation respects minimum subtotal and maximum discount', function () {
  var belowMinimum = invoice.computeInvoiceFigures({
    coupon: 'SAVE10',
    items: [{ price: 100, qty: 1 }]
  });
  var aboveMaximum = invoice.computeInvoiceFigures({
    coupon: 'SAVE10',
    items: [{ price: 2000, qty: 1 }]
  });
  var ledgerAboveMaximum = pricing.computeTotals([{ price: 2000, qty: 1 }], 'SAVE10');

  assert.equal(belowMinimum.discount, 0);
  assert.equal(aboveMaximum.discount, 150);
  assert.equal(ledgerAboveMaximum.discount, 150);
  assert.equal(aboveMaximum.tax, ledgerAboveMaximum.tax);
  assert.equal(aboveMaximum.total, ledgerAboveMaximum.total);
});

test('GST reconciliation matches invoice figures to ledger figures', function () {
  var items = [{ id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 1000, qty: 1 }];
  var totals = pricing.computeTotals(items, 'SAVE10');
  var result = reports.getGstReconciliation({
    orders: [{
      id: 1001,
      date: '21/11/2026',
      customer: 'Walk-in',
      coupon: 'SAVE10',
      status: 'completed',
      items: items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total
    }]
  });

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  assert.equal(result.rows[0].ledgerTax, 45);
  assert.equal(result.rows[0].invoiceTax, 45);
  assert.equal(result.rows[0].ledgerTotal, 945);
  assert.equal(result.rows[0].invoiceTotal, 945);
  assert.equal(result.rows[0].delta, 0);
  assert.equal(result.rows[0].matched, true);
});
