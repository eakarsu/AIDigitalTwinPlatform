ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE TABLE IF NOT EXISTS twin_operations(
 id BIGSERIAL PRIMARY KEY,tenant_id TEXT NOT NULL,asset_external_id TEXT NOT NULL,topology_version TEXT NOT NULL,model_version TEXT NOT NULL,idempotency_key TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'registered',created_by BIGINT NOT NULL,control_adapter_receipt TEXT,version INTEGER NOT NULL DEFAULT 1,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW(),UNIQUE(tenant_id,idempotency_key),
 CHECK(state IN('registered','synchronizing','synchronized','simulation_ready','action_pending','action_approved','executing','degraded','retired'))
);
CREATE TABLE IF NOT EXISTS twin_telemetry(id BIGSERIAL PRIMARY KEY,operation_id BIGINT NOT NULL REFERENCES twin_operations(id) ON DELETE RESTRICT,asset_external_id TEXT NOT NULL,metric TEXT NOT NULL,unit TEXT NOT NULL,value DOUBLE PRECISION NOT NULL,sequence BIGINT NOT NULL,observed_at TIMESTAMPTZ NOT NULL,quality TEXT NOT NULL,ingested_at TIMESTAMPTZ DEFAULT NOW(),UNIQUE(operation_id,metric,sequence));
CREATE TABLE IF NOT EXISTS twin_operation_events(id BIGSERIAL PRIMARY KEY,operation_id BIGINT NOT NULL REFERENCES twin_operations(id) ON DELETE RESTRICT,actor_id BIGINT NOT NULL,from_state TEXT,to_state TEXT NOT NULL,details JSONB NOT NULL DEFAULT '{}',created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS twin_operations_tenant_state_idx ON twin_operations(tenant_id,state);
