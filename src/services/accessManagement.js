const config = require('config');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const userModel = require('models/users');
const { error } = require('utils/logger');

const client = new OAuth2Client(config.get('googleClientId'));

const verifyAndGetTokenPayload = async ({ googleJwt }) => {
  const ticket = await client.verifyIdToken({
    idToken: googleJwt,
    audience: config.get('googleClientId'),
  });
  const payload = ticket.getPayload();
  return payload;
};

const issueAccessToken = async ({ refreshToken }) => {
  try {
    const decodedToken = jwt.verify(refreshToken, config.get('refreshJwtSecret'));

    if (!(decodedToken && decodedToken.userId)) {
      return { ok: false, msg: 'Invalid refresh token' };
    }

    const user = await userModel.getUserById({ userId: decodedToken.userId });

    if (!user) {
      return { ok: false, msg: 'User not found for the refresh token' };
    }

    const expiresIn = 60; // seconds

    const accessToken = jwt.sign({ userId: decodedToken.userId }, config.get('accessJwtSecret'), {
      expiresIn,
    });

    if (accessToken) {
      return { ok: true, data: { token: accessToken, expiresIn } };
    }

    return { ok: false, msg: 'Something went wrong, we are looking into it!' };
  } catch (e) {
    error(e);
    return { ok: false, msg: 'Something went wrong, we are looking into it!' };
  }
};

const logInUser = async ({ googleJwt }) => {
  try {
    const payload = await verifyAndGetTokenPayload({ googleJwt });

    if (!payload) {
      return { ok: false, msg: 'Not Authorised' };
    }

    const { sub: socialUserId, name, email, picture: avatar } = payload;

    if (!(socialUserId, name, email, avatar)) {
      return { ok: false, msg: 'Not Authorised' };
    }

    let user = await userModel.getUserBySocialId({ socialUserId });

    if (!user) {
      user = await userModel.createUser({
        name,
        email,
        avatar,
        socialId: socialUserId,
        signInPlatform: 'google',
      });
    }

    if (!user) {
      return { ok: false, msg: 'Something went wrong while signing you up!' };
    }

    const { _id: userId } = user;

    const refreshToken = jwt.sign({ userId }, config.get('refreshJwtSecret'), {
      expiresIn: '7d', // 7 days
    });

    const accessTokenResponse = await issueAccessToken({ refreshToken });

    if (
      accessTokenResponse &&
      accessTokenResponse.data &&
      accessTokenResponse.data.token &&
      accessTokenResponse.data.expiresIn &&
      refreshToken
    ) {
      return {
        ok: true,
        data: { accessToken: accessTokenResponse.data, refreshToken },
      };
    }

    return { ok: false, msg: 'Something went wrong, we are looking into it!' };
  } catch (e) {
    error(e);
    return { ok: false, msg: 'Something went wrong, we are looking into it!' };
  }
};

module.exports = { logInUser, issueAccessToken };
