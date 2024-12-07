import React, { useState, useEffect } from 'react';
import Chessboard from 'chessboardjsx';
import { io } from 'socket.io-client';

//const socket = io('https://chess-backend-q9sp.onrender.com/'); 
//const socket = io("https://chess-backend-yot6.onrender.com", {transports: ["websocket"],});
//const socket = io('http://127.0.0.1:5000/'); 
const socket = io('https://vtqn-chess-backend.fayedark.com')

const App = () => {
  const [position, setPosition] = useState('start');
  const [whiteMode, setWhiteMode] = useState('Human');
  const [blackMode, setBlackMode] = useState('Human');
  const [whiteDepth, setWhiteDepth] = useState(3);
  const [blackDepth, setBlackDepth] = useState(3);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStarted, setGameStarted] = useState(false);
  const [aiDelay, setAiDelay] = useState(0);
  const [announcement, setAnnouncement] = useState(null);
  const [PromotionMove, setPromotionMove] = useState(null);
  const [promotionModalVisible, setPromotionModalVisible] = useState(false)

  useEffect(() => {
    socket.on('update', (data) => {
      setPosition(data.fen);
      setCurrentTurn(data.turn);
      console.log(data.message)
    });

    socket.on('announcement', (data) => {
      setAnnouncement(data.result);
      setGameStarted(false); // Stop the game when there's an announcement
    });

    socket.on('error', (data) => {
      console.error('Error:', data.message);
    });

    socket.emit('reset');

    return () => {
      socket.off('update');
      socket.off('announcement');
      socket.off('error');
    };
  }, []);

  const handleMove = ({ sourceSquare, targetSquare }) => {
    if (gameStarted && ((currentTurn === 'white' && whiteMode === 'Human') || (currentTurn === 'black' && blackMode === 'Human'))) {
      if (
        (currentTurn === 'white' && targetSquare[1] === '8') ||
        (currentTurn === 'black' && targetSquare[1] === '1')) {
        // Show promotion modal if the move reaches the promotion rank
        setPromotionMove(sourceSquare + targetSquare); // Set the move
        setPromotionModalVisible(true);
      } else {
        socket.emit('move', { from: sourceSquare, to: targetSquare, promotion: '' });
      }
    }
  };

  const handlePromotion = (piece) => {
    socket.emit('move', { from: PromotionMove, to: '', promotion: piece }); // from and to are merged into PromotionMove
    setPromotionModalVisible(false); // Hide the promotion modal
  };

  const handleReset = () => {
    setGameStarted(false);
    setAnnouncement(null);
    socket.emit('reset');
  };

  const requestAIMove = (turn, mode, depth) => {
    setTimeout(() => {
      if (gameStarted) {
        socket.emit('ai_move', { turn, mode, depth });
      }
    }, aiDelay);
  };

  useEffect(() => {
    if (gameStarted) {
      if (currentTurn === 'white' && whiteMode !== 'Human') {
        requestAIMove('white', whiteMode, whiteDepth);
      } else if (currentTurn === 'black' && blackMode !== 'Human') {
        requestAIMove('black', blackMode, blackDepth);
      }
    }
  }, [currentTurn, whiteMode, blackMode, whiteDepth, blackDepth, gameStarted]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Chess Game</h1>
      <p>Press Start to be able to play</p>
      {announcement && <h2 style={{ color: 'red' }}>{announcement}</h2>}
      <div style={{ marginBottom: '20px' }}>
        <label>
          White Mode:
          <select value={whiteMode} onChange={(e) => setWhiteMode(e.target.value)} style={{ marginLeft: '10px' }}>
            <option value="Human">Human</option>
            <option value="Minimax">Minimax</option>
            <option value="AlphaBeta">Alpha-Beta</option>
            <option value="MCTS">MCTS</option>
            <option value="MCTS_NN">MCTS + NN</option>
          </select>
        </label>
        <input
          type="number"
          value={whiteDepth}
          onChange={(e) => setWhiteDepth(Number(e.target.value))}
          style={{ marginLeft: '10px', width: '60px' }}
          min="1"
        />
        <label style={{ marginLeft: '20px' }}>
          Black Mode:
          <select value={blackMode} onChange={(e) => setBlackMode(e.target.value)} style={{ marginLeft: '10px' }}>
            <option value="Human">Human</option>
            <option value="Minimax">Minimax</option>
            <option value="AlphaBeta">Alpha-Beta</option>
            <option value="MCTS">MCTS</option>
            <option value="MCTS_NN">MCTS + NN</option>
          </select>
        </label>
        <input
          type="number"
          value={blackDepth}
          onChange={(e) => setBlackDepth(Number(e.target.value))}
          style={{ marginLeft: '10px', width: '60px' }}
          min="1"
        />
      </div>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setGameStarted(true)}
          style={{ padding: '10px 20px', fontSize: '16px' }}
          disabled={gameStarted || announcement}
        >
          Start
        </button>
        <button onClick={handleReset} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Play Again
        </button>
        <label style={{ padding: '10px 20px', fontSize: '16px' }}>
          AI Delay (ms):
          <input
            type="number"
            value={aiDelay}
            onChange={(e) => setAiDelay(Number(e.target.value))}
            style={{ marginLeft: '10px', width: '80px' }}
            min="0"
          />
        </label>
      </div>
       {/* Promotion Modal */}
       {promotionModalVisible && (
        <div >
          <h3>Promote Pawn</h3>
          <button onClick={() => handlePromotion('q')}>Queen</button>
          <button onClick={() => handlePromotion('r')}>Rook</button>
          <button onClick={() => handlePromotion('b')}>Bishop</button>
          <button onClick={() => handlePromotion('k')}>Knight</button>
        </div>
      )}
      <Chessboard position={position} onDrop={handleMove} draggablePieces={gameStarted} />
    </div>
  );
};

export default App;
