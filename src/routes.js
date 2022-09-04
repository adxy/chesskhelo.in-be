// node modules
const router = require('express').Router();

// routes
router.get('/', (_req, res) => res.send('Roam Around!'));

router.get('/healthz', (_req, res) => res.json({ status: 'success' }));

module.exports = router;
