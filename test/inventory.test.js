var test = require('node:test');
var assert = require('node:assert/strict');

var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('inventory check allows selling exactly all sellable units', function () {
  var products = [
    { id: 1, name: 'Ghee', stock: 1, reserved: 0 },
    { id: 2, name: 'Chilli powder', stock: 4, reserved: 3 }
  ];

  assert.equal(inventory.getSellableStock(products[0]), 1);
  assert.equal(inventory.check(products, [{ id: 1, qty: 1 }]).ok, true);
  assert.equal(inventory.check(products, [{ id: 2, qty: 1 }]).ok, true);
  assert.equal(inventory.check(products, [{ id: 2, qty: 2 }]).ok, false);
});

test('cancelling a pending order restores physical and sellable stock', function () {
  var db = {
    products: [
      { id: 1, name: 'Ghee', stock: 3, reserved: 0 },
      { id: 2, name: 'Sunflower oil', stock: 5, reserved: 1 }
    ],
    orders: [{
      id: 1007,
      status: 'pending',
      paymentMode: 'cash',
      items: [
        { id: 1, qty: 2 },
        { id: 2, qty: 2 }
      ]
    }]
  };

  var result = orders.cancel(db, 1007, 'Cancelled from order history');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.equal(db.products[0].stock, 5);
  assert.equal(inventory.getSellableStock(db.products[0]), 5);
  assert.equal(db.products[1].stock, 7);
  assert.equal(inventory.getSellableStock(db.products[1]), 6);

  var repeatedCancel = orders.cancel(db, 1007, 'Duplicate request');
  assert.equal(repeatedCancel.ok, false);
  assert.equal(db.products[0].stock, 5);
  assert.equal(db.products[1].stock, 7);
});
