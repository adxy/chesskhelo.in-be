const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:3000', // Make sure this has same port as frontend server
  credentials: true, // access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

module.exports = cors(corsOptions);
