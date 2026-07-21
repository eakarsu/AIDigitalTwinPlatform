const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTelemetry, assertTransition } = require('../domain/twinWorkflow');

test('telemetry is unit-aware and monotonic', () => {
  const sample = { assetExternalId: 'pump-1', metric: 'pressure', unit: 'kPa', value: 20, sequence: 4, observedAt: '2026-01-01T00:00:00Z' };
  assert.equal(validateTelemetry(sample, 3), true);
  assert.throws(() => validateTelemetry(sample, 4), /out-of-order/);
});

test('simulation proposals cannot directly execute control', () => {
  assert.throws(() => assertTransition('simulation_ready', 'action_pending', { source: 'model' }), /simulation/);
  assert.throws(() => assertTransition('action_approved', 'executing', {}), /receipt/);
});
