const { isValidObjectId } = require('mongoose');
const { response } = require('express');

const { error } = require('utils/logger');
const userService = require('services/users');

module.exports = {
  getUser: async (req, res) => {
    const userId = req.userId;

    if (!(userId && isValidObjectId(userId))) {
      return res.failure({ msg: 'Invalid/Undefined userId' });
    }

    try {
      const userResponse = await userService.getUser({ userId });

      if (userResponse && userResponse.ok && userResponse.data) {
        return res.success({ data: userResponse.data });
      }
      return res.failure({ msg: response.msg });
    } catch (e) {
      error(e);
      return res.failure({ msg: response.msg });
    }
  },
};
