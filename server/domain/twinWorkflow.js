const TRANSITIONS = Object.freeze({
  registered: ['synchronizing', 'retired'], synchronizing: ['synchronized', 'degraded'],
  synchronized: ['simulation_ready', 'degraded'], simulation_ready: ['action_pending', 'synchronizing'],
  action_pending: ['action_approved', 'simulation_ready'], action_approved: ['executing', 'simulation_ready'],
  executing: ['synchronized', 'degraded'], degraded: ['synchronizing', 'retired'], retired: []
});

function validateTelemetry(sample, previousSequence = -1) {
  if (!sample || !sample.assetExternalId || !sample.metric || !sample.unit || !sample.observedAt) throw new Error('assetExternalId, metric, unit, and observedAt are required');
  if (!Number.isFinite(sample.value) || !Number.isInteger(sample.sequence)) throw new Error('numeric value and integer sequence required');
  if (sample.sequence <= previousSequence) throw new Error('out-of-order or duplicate telemetry');
  if (Number.isNaN(Date.parse(sample.observedAt))) throw new Error('observedAt must be an ISO date');
  return true;
}

function assertTransition(from, to, context = {}) {
  if (!(TRANSITIONS[from] || []).includes(to)) throw new Error(`transition ${from} -> ${to} is not allowed`);
  if (to === 'action_pending' && context.source !== 'simulation') throw new Error('only simulation output may propose an action');
  if (to === 'action_approved' && (!context.operatorId || !context.modelVersion)) throw new Error('operator approval and model version required');
  if (to === 'executing' && !context.controlAdapterReceipt) throw new Error('external control-adapter receipt required');
  return true;
}

module.exports = { TRANSITIONS, validateTelemetry, assertTransition };
