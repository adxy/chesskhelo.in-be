const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, required: true },
    selectedAvatar: { type: String },
    socialId: { type: String, unique: true },
    signInPlatform: { type: String, enum: ['google', 'chesskhelo'], default: 'chesskhelo' },
    settings: { autoPromotionEnabled: { type: Boolean, default: false } },
  },
  { timestamps: true }
);

const usersModel = mongoose.model('users', usersSchema, 'users');

module.exports = {
  findOne: async ({ query, projection }) => usersModel.findOne(query, projection).lean(),

  updateOne: async ({ query, updateDict }) => usersModel.updateOne(query, updateDict),

  createUser: async ({ name, email, avatar, socialId, signInPlatform }) =>
    new usersModel({
      name,
      email,
      avatar,
      selectedAvatar: avatar,
      socialId,
      signInPlatform,
    }).save(),

  getUserById: async ({ userId }) => usersModel.findOne({ _id: userId }).lean(),

  getUserBySocialId: async ({ socialUserId }) =>
    usersModel.findOne({ socialId: socialUserId }, { name: 1, email: 1, avatar: 1 }).lean(),

  updateSelectedAvatar: async ({ selectedAvatar }) =>
    usersModel.updateOne({ selectedAvatar }, { $set: { selectedAvatar: selectedAvatar } }),
};
