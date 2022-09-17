const { error } = require('utils/logger');
const accessManagementService = require('services/accessManagement');

module.exports = {
  logInUser: async (req, res) => {
    const { googleJwt } = req.body;

    if (!googleJwt) {
      return res.unauthorized({ msg: 'Missing or invalid Id Token' });
    }

    try {
      const response = await accessManagementService.logInUser({ googleJwt });

      if (response.ok && response.data && response.data.accessToken && response.data.refreshToken) {
        res.cookie('ck_refresh_token', response.data.refreshToken, {
          maxAge: 604800000,
          httpOnly: true,
        }); // maxAge - 1 week
        return res.success({ data: response.data.accessToken });
      }

      return res.failure({ msg: response.msg });
    } catch (e) {
      error(e);
      return res.failure({ msg: 'Something went wrong!' });
    }
  },

  logOutUser: async (req, res) => {
    try {
      res.cookie('ck_refresh_token', '', { maxAge: 1, httpOnly: true });
      return res.success({});
    } catch (e) {
      error(e);
      return res.failure({ msg: 'Something went wrong while logging you out!' });
    }
  },

  issueAccessToken: async (req, res) => {
    const refreshToken = req.refreshToken;

    if (!refreshToken) {
      return res.unauthorized({ msg: 'Missing or invalid Refresh Token' });
    }

    try {
      const response = await accessManagementService.issueAccessToken({ refreshToken });

      if (response.ok && response.data && response.data.token && response.data.expiresIn) {
        return res.success({ data: response.data });
      }
      return res.failure({ msg: response.msg });
    } catch (e) {
      error(e);
      return res.failure({ msg: 'Something went wrong!' });
    }
  },
};
