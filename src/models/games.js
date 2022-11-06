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

const GamesModel = mongoose.model('games', gamesSchema, 'games');

module.exports = {
  findOne: async ({ query, projection }) => GamesModel.findOne(query, projection).lean(),

  updateOne: async ({ query, updateDict }) => GamesModel.updateOne(query, updateDict),

  saveGame: async ({ pgn, wUserId, bUserId, offeredDraw, winner, result }) =>
    new GamesModel({ pgn, wUserId, bUserId, offeredDraw, winner, result }).save(),

  getGameById: async ({ gameId }) => GamesModel.findOne({ _id: gameId }).lean(),
};
