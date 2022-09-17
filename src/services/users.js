const { getUserById } = require('models/users');

module.exports = {
  getUser: async ({ userId }) => {
    try {
      const user = await getUserById({ userId });

      if (user && user.name && user.email && user.selectedAvatar && user.settings) {
        return {
          ok: true,
          data: {
            name: user.name,
            email: user.email,
            avatar: user.selectedAvatar,
            settings: user.settings,
          },
        };
      }
      return { ok: false, msg: 'Something went wrong' };
    } catch (e) {
      error(e);
      return { ok: false, msg: 'Something went wrong!' };
    }
  },
};
