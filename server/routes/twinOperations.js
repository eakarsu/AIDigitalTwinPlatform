const router=require('express').Router();
const {QueryTypes}=require('sequelize');
const {sequelize}=require('../models');
const {authMiddleware}=require('../middleware/auth');
const {validateTelemetry,assertTransition}=require('../domain/twinWorkflow');
router.use(authMiddleware);
function tenant(req){const t=req.user.tenantId||req.user.tenant_id;if(!t)throw new Error('tenant-bound identity required');return String(t);}

router.post('/',async(req,res)=>{try{if(!req.body.assetExternalId||!req.body.topologyVersion||!req.body.modelVersion||!req.body.idempotencyKey)throw new Error('assetExternalId, topologyVersion, modelVersion, and idempotencyKey required');const [row]=await sequelize.query(`INSERT INTO twin_operations(tenant_id,asset_external_id,topology_version,model_version,idempotency_key,state,created_by)
 VALUES(:tenant,:asset,:topology,:model,:key,'registered',:actor) ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,{replacements:{tenant:tenant(req),asset:req.body.assetExternalId,topology:req.body.topologyVersion,model:req.body.modelVersion,key:req.body.idempotencyKey,actor:req.user.id},type:QueryTypes.INSERT});res.status(201).json(row[0]||row);
}catch(e){res.status(400).json({error:e.message});}});

router.post('/:id/telemetry',async(req,res)=>{try{const rows=await sequelize.query(`SELECT o.*,(SELECT MAX(sequence) FROM twin_telemetry t WHERE t.operation_id=o.id AND t.metric=:metric) previous_sequence FROM twin_operations o WHERE o.id=:id AND o.tenant_id=:tenant`,{replacements:{id:req.params.id,tenant:tenant(req),metric:req.body.metric},type:QueryTypes.SELECT});if(!rows[0])return res.status(404).json({error:'twin operation not found'});validateTelemetry(req.body,Number(rows[0].previous_sequence??-1));await sequelize.query(`INSERT INTO twin_telemetry(operation_id,asset_external_id,metric,unit,value,sequence,observed_at,quality)VALUES(:id,:asset,:metric,:unit,:value,:sequence,:observed,:quality)`,{replacements:{id:req.params.id,asset:req.body.assetExternalId,metric:req.body.metric,unit:req.body.unit,value:req.body.value,sequence:req.body.sequence,observed:req.body.observedAt,quality:req.body.quality||'measured'},type:QueryTypes.INSERT});res.status(202).json({accepted:true});
}catch(e){res.status(400).json({error:e.message});}});

router.post('/:id/transition',async(req,res)=>{try{const rows=await sequelize.query('SELECT * FROM twin_operations WHERE id=:id AND tenant_id=:tenant',{replacements:{id:req.params.id,tenant:tenant(req)},type:QueryTypes.SELECT});if(!rows[0])return res.status(404).json({error:'twin operation not found'});assertTransition(rows[0].state,req.body.to,{...req.body,operatorId:req.user.id});const updated=await sequelize.query(`UPDATE twin_operations SET state=:to,control_adapter_receipt=COALESCE(:receipt,control_adapter_receipt),version=version+1,updated_at=NOW() WHERE id=:id AND tenant_id=:tenant RETURNING *`,{replacements:{to:req.body.to,receipt:req.body.controlAdapterReceipt||null,id:req.params.id,tenant:tenant(req)},type:QueryTypes.UPDATE});await sequelize.query(`INSERT INTO twin_operation_events(operation_id,actor_id,from_state,to_state,details)VALUES(:id,:actor,:fromState,:to,:details::jsonb)`,{replacements:{id:req.params.id,actor:req.user.id,fromState:rows[0].state,to:req.body.to,details:JSON.stringify(req.body.details||{})},type:QueryTypes.INSERT});res.json(updated[0][0]||updated[0]);
}catch(e){res.status(409).json({error:e.message});}});
module.exports=router;
