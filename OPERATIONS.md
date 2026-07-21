# Operations and safety boundary

Runtime startup never installs, seeds, migrates, starts PostgreSQL, synchronizes models, or kills another process. Use the explicit scripts in `scripts/`.

`/api/twin-operations` binds asset identity, topology/model versions, unit-bearing monotonic telemetry, simulation proposals, operator approvals, adapter receipts, and event history. Simulation cannot directly actuate control. IoT gateways, registries, time-series stores, CAD/BIM, simulation, CMMS, and control adapters remain disabled until device authentication, sandbox integration, fidelity, latency, missing-data, and degraded-mode tests pass.
