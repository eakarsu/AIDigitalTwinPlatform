const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({
  summary: { twins_monitored: 36, drift_alerts: 7, retraining_needed: 4, memory_conflicts: 9 },
  twins: [
    { twin: 'Customer Success Lead', drift: 'tone divergence', score: 81, action: 'refresh conversation samples' },
    { twin: 'Ops Manager', drift: 'obsolete process memory', score: 74, action: 'resolve memory conflict' },
    { twin: 'Sales Coach', drift: 'new objection pattern', score: 68, action: 'continuous learning batch' },
  ],
}));

module.exports = router;
