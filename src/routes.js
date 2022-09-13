// node modules
const router = require('express').Router();

// Middlewares
const { authenticate, authenticateByCookie } = require('./middlewares/auth');

//controllers
const accessManagement = require('controllers/accessManagement');

// routes
router.get('/', (_req, res) => res.send('Khao piyo aish karo mitron!'));

router.get('/healthz', (_req, res) => res.json({ status: 'success' }));

router
  .route('/v1/login')
  .post(accessManagement.logInUser)
  .delete(authenticate, accessManagement.logOutUser);

router.get('/v1/access-token', authenticateByCookie, accessManagement.issueAccessToken);

module.exports = router;
