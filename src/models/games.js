const mongoose = require('mongoose');

const gamesSchema = new mongoose.Schema(
  {
    pgn: { type: String, required: true },
    wUserId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users' },
    bUserId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users' },
    offeredDraw: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    result: {
      type: String,
      enum: [
        'draw-by-agreement',
        'draw-by-threefold-repetition',
        'draw-by-fifty-move-rule',
        'draw-by-insufficient-material',
        'stalemate',
        'checkmate',
        'resignation',
        'timeout',
      ],
      required: true,
    },
  },
  { timestamps: true }
);

const gamesModel = mongoose.model('games', gamesSchema, 'games');

module.exports = {
  findOne: async ({ query, projection }) => usersModel.findOne(query, projection).lean(),

  updateOne: async ({ query, updateDict }) => usersModel.updateOne(query, updateDict),

  saveGame: async ({ pgn, wUserId, bUserId, offeredDraw, winner, result }) =>
    new gamesModel({ pgn, wUserId, bUserId, offeredDraw, winner, result }).save(),

  getGameById: async ({ gameId }) => gamesModel.findOne({ _id: gameId }).lean(),
};
