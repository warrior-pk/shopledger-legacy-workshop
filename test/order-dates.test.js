var test = require('node:test');
var assert = require('node:assert/strict');

var dates = require('../lib/dates');
var orders = require('../lib/orders');

test('order history sorts mixed-format dates newest first', function () {
  var db = {
    orders: [
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' },
      { id: 1008, date: '15/03/2022' },
      { id: 1007, date: '04/03/2022' },
      { id: 1009, date: '2022-03-15' }
    ]
  };

  assert.deepEqual(orders.list(db, {}).map(function (order) { return order.id; }), [1009, 1008, 1007, 1004, 1001]);
});

test('order history date range filters include only dates within the ISO range', function () {
  var db = {
    orders: [
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' },
      { id: 1008, date: '15/03/2022' },
      { id: 1007, date: '04/03/2022' }
    ]
  };

  var result = orders.list(db, { from: '2022-01-01', to: '2022-01-31' });

  assert.deepEqual(result.map(function (order) { return order.id; }), [1004]);
  assert.equal(dates.getFiscalYear('2022-01-31'), 'FY21-22');
});
