var test = require('node:test');
var assert = require('node:assert/strict');

var ledger = require('../lib/ledger');

test('Khata settlement adds a numeric request amount and updates the balance', function () {
  var db = {
    customers: [{
      id: 7,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200
    }],
    nextSettlementId: 501,
    settlements: []
  };

  var result = ledger.recordSettlement(db, 7, '500', 'upi', 'Counter payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.settlements[0].amount, 500);
});

test('Khata settlement rejects nonnumeric and nonpositive amounts', function () {
  var db = { customers: [{ id: 7, name: 'Meera Joshi' }], settlements: [] };

  assert.equal(ledger.recordSettlement(db, 7, 'not-a-number').ok, false);
  assert.equal(ledger.recordSettlement(db, 7, '0').ok, false);
  assert.equal(ledger.recordSettlement(db, 7, '-1').ok, false);
  assert.equal(db.settlements.length, 0);
});
