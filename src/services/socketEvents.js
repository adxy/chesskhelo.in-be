const { v4: uuidv4 } = require('uuid');

const Chess = require('utils/moveValidation');
const gamesModel = require('models/games');
const { error } = require('utils/logger');

const gameData = new Map();

const playerJoins = ({ gameId, userId }, socket, io) => {
  try {
    const game = gameData.get(gameId);
    if (!game) {
      io.to(gameId).emit('status', { status: 'notFound' });
      return;
    }

    const bothUserJoinedGameOnce = game.wUserId !== undefined && game.bUserId !== undefined;
    const isReturningUser = game.wUserId === userId || game.bUserId === userId;

    if (bothUserJoinedGameOnce) {
      if (isReturningUser) {
        socket.join(gameId);
      }
    }
    if (!bothUserJoinedGameOnce) {
      if (!isReturningUser) {
        if (game.wUserId) {
          game.bUserId = userId;
        } else {
          game.wUserId = userId;
        }

        gameData.set(gameId, game);
      }
      socket.join(gameId);
    }

    if (game.wUserId && game.bUserId) {
      io.to(gameId).emit('status', { status: 'inProgress', game });
      if (!isReturningUser) {
        io.to(gameId).emit('message', {
          userId: 'system',
          type: 'system',
          text: 'You can message each other here! Good Luck!',
        });
      }
      return;
    }

    io.to(gameId).emit('status', { status: 'waiting' });
  } catch (e) {
    error(e);
  }
};

const abort = ({ gameId }, socket, io) => {
  try {
    const game = gameData.get(gameId);
    if (!game) {
      io.to(gameId).emit('status', { status: 'notFound' });
      return;
    }

    gameData.delete(gameId);
    game.result = 'aborted';
    io.to(gameId).emit('status', { status: 'gameOver', game });
  } catch (e) {
    error(e);
  }
};

const resign = ({ gameId, userId }, socket, io) => {
  try {
    const game = gameData.get(gameId);
    if (!game) {
      io.to(gameId).emit('status', { status: 'notFound' });
      return;
    }

    gameData.delete(gameId);
    game.winner = game.wUserId === userId ? game.bUserId : game.wUserId;
    game.result = 'resignation';
    io.to(gameId).emit('status', { status: 'gameOver', game });
    gamesModel.saveGame(game);
  } catch (e) {
    error(e);
  }
};

const offerDraw = ({ gameId, userId }, socket, io) => {
  try {
    const game = gameData.get(gameId);
    if (!game) {
      io.to(gameId).emit('status', { status: 'notFound' });
      return;
    }
    if (game.drawOffered) {
      return;
    }
    game.drawOffered = userId;
    gameData.set(game);
    io.to(gameId).emit('message', {
      userId,
      type: 'draw',
    });
  } catch (e) {
    error(e);
  }
};

const acceptDraw = ({ gameId }, socket, io) => {
  try {
    const game = gameData.get(gameId);
    if (!game) {
      io.to(gameId).emit('status', { status: 'notFound' });
      return;
    }

    game.result = 'draw-by-agreement';
    io.to(gameId).emit('message', {
      userId: 'system',
      type: 'system',
      text: 'Draw Accepted!',
    });
    io.to(gameId).emit('status', { status: 'acceptedDraw', game });
    gameData.delete(gameId);
    gamesModel.saveGame(game);
  } catch (e) {
    error(e);
  }
};

const rejectDraw = ({ gameId }, socket, io) => {
  try {
    const game = gameData.get(gameId);
    if (!game) {
      io.to(gameId).emit('status', { status: 'notFound' });
      return;
    }
    game.drawOffered = undefined;
    gameData.set(gameId, game);
    io.to(gameId).emit('message', {
      userId: 'system',
      type: 'system',
      text: 'Draw Rejected!',
    });
    io.to(gameId).emit('status', { status: 'rejectedDraw', game });
  } catch (e) {
    error(e);
  }
};

const makeMove = ({ move, gameId, userId }, socket, io) => {
  try {
    const game = gameData.get(gameId);
    if (!game) {
      io.to(gameId).emit('status', { status: 'notFound' });
      return;
    }

    const chess = new Chess();
    chess.load_pgn(game.pgn);

    const newMove = chess.move(move);

    if (newMove && game.drawOffered && game.drawOffered !== userId) {
      rejectDraw({ gameId, userId }, socket, io);
    }

    if (newMove) {
      const newGameData = game;
      newGameData.pgn = chess.pgn();
      gameData.set(gameId, newGameData);

      const gameOver = chess.game_over();

      if (gameOver) {
        newGameData.result = gameOver;
        newGameData.winner = gameOver === 'checkmate' ? userId : undefined;
        gamesModel.saveGame(newGameData);
      }

      if (move.promotion) {
        newMove.promotion = move.promotion;
      }
      io.to(gameId).emit('move', newMove);

      if (gameOver) {
        io.to(gameId).emit('status', { status: 'gameOver', game });
      }
      return;
    }
    io.to(gameId).emit('status', { status: 'invalidMove' });
  } catch (e) {
    error(e);
  }
};

const message = ({ userId, gameId, type, text }, socket, io) => {
  try {
    if (userId && type && text) {
      io.to(gameId).emit('message', { userId, type, text });
    }
  } catch (e) {
    error(e);
  }
};

const createNewGame = ({ userId, color }, socket, io) => {
  try {
    const chess = new Chess();
    const gameId = uuidv4();
    gameData.set(gameId, {
      pgn: chess.pgn(),
      wUserId: color === 'w' ? userId : undefined,
      bUserId: color === 'b' ? userId : undefined,
      drawOffered: undefined,
      result: undefined,
      winner: undefined,
    });
    socket.join(gameId);
    io.to(gameId).emit('gameId', { gameId });
  } catch (e) {
    error(e);
  }
};

const handleSocketEvents = ({ socket, io }) => {
  // socket.on('disconnect', onDisconnect);

  socket.on('move', (event) => makeMove(event, socket, io));

  socket.on('resign', (event) => resign(event, socket, io));

  socket.on('abort', (event) => abort(event, socket, io));

  socket.on('offerDraw', (event) => offerDraw(event, socket, io));

  socket.on('rejectDraw', (event) => rejectDraw(event, socket, io));

  socket.on('acceptDraw', (event) => acceptDraw(event, socket, io));

  socket.on('createNewGame', (event) => createNewGame(event, socket, io));

  socket.on('playerJoins', (event) => playerJoins(event, socket, io));

  socket.on('message', (event) => message(event, socket, io));
};

module.exports = { handleSocketEvents };
