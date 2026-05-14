import React, { useState, useEffect, useMemo } from 'react';

const initialBoard = [
    [{type: 'r', color: 'b'}, {type: 'n', color: 'b'}, {type: 'b', color: 'b'}, {type: 'q', color: 'b'}, {type: 'k', color: 'b'}, {type: 'b', color: 'b'}, {type: 'n', color: 'b'}, {type: 'r', color: 'b'}],
    [{type: 'p', color: 'b'}, {type: 'p', color: 'b'}, {type: 'p', color: 'b'}, {type: 'p', color: 'b'}, {type: 'p', color: 'b'}, {type: 'p', color: 'b'}, {type: 'p', color: 'b'}, {type: 'p', color: 'b'}],
    Array(8).fill(null),
    Array(8).fill(null), //
    Array(8).fill(null),
    Array(8).fill(null),
    [{type: 'p', color: 'w'}, {type: 'p', color: 'w'}, {type: 'p', color: 'w'}, {type: 'p', color: 'w'}, {type: 'p', color: 'w'}, {type: 'p', color: 'w'}, {type: 'p', color: 'w'}, {type: 'p', color: 'w'}],
    [{type: 'r', color: 'w'}, {type: 'n', color: 'w'}, {type: 'b', color: 'w'}, {type: 'q', color: 'w'}, {type: 'k', color: 'w'}, {type: 'b', color: 'w'}, {type: 'n', color: 'w'}, {type: 'r', color: 'w'}]
];

const PIECES = {
    'wk': '♔', 'wq': '♕', 'wr': '♖', 'wb': '♗', 'wn': '♘', 'wp': '♙',
    'bk': '♚', 'bq': '♛', 'br': '♜', 'bb': '♝', 'bn': '♞', 'bp': '♟'
};

const PIECE_VALUES = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };

const isSquareAttacked = (board, r, c, attackerColor) => {
    const dirs = {
        straight: [[-1,0], [1,0], [0,-1], [0,1]],
        diagonal: [[-1,-1], [-1,1], [1,-1], [1,1]],
        knight: [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]],
        king: [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]]
    };

    for (let [dr, dc] of dirs.knight) {
        let nr = r + dr, nc = c + dc;
        if (nr>=0 && nr<8 && nc>=0 && nc<8) {
            let p = board[nr][nc];
            if (p && p.color === attackerColor && p.type === 'n') return true;
        }
    }

    for (let [dr, dc] of dirs.straight) {
        let nr = r + dr, nc = c + dc;
        while (nr>=0 && nr<8 && nc>=0 && nc<8) {
            let p = board[nr][nc];
            if (p) {
                if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) return true;
                break;
            }
            nr += dr; nc += dc;
        }
    }

    for (let [dr, dc] of dirs.diagonal) {
        let nr = r + dr, nc = c + dc;
        while (nr>=0 && nr<8 && nc>=0 && nc<8) {
            let p = board[nr][nc];
            if (p) {
                if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) return true;
                break;
            }
            nr += dr; nc += dc;
        }
    }

    for (let [dr, dc] of dirs.king) {
        let nr = r + dr, nc = c + dc;
        if (nr>=0 && nr<8 && nc>=0 && nc<8) {
            let p = board[nr][nc];
            if (p && p.color === attackerColor && p.type === 'k') return true;
        }
    }

    let pr = r - (attackerColor === 'w' ? -1 : 1);
    for (let dc of [-1, 1]) {
        let pc = c + dc;
        if (pr>=0 && pr<8 && pc>=0 && pc<8) {
            let p = board[pr][pc];
            if (p && p.color === attackerColor && p.type === 'p') return true;
        }
    }

    return false;
};

const getPseudoLegalMoves = (board, r, c, enPassant) => {
    const p = board[r][c];
    if (!p) return [];
    const moves = [];
    const color = p.color;
    const type = p.type;

    const addMove = (nr, nc, moveType='normal') => {
        if (nr>=0 && nr<8 && nc>=0 && nc<8) {
            const target = board[nr][nc];
            if (!target || target.color !== color) {
                moves.push({r: nr, c: nc, type: moveType, target});
                return !target;
            }
        }
        return false;
    };

    if (type === 'n') {
        const knightMoves = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]];
        knightMoves.forEach(([dr, dc]) => addMove(r+dr, c+dc));
    } else if (type === 'k') {
        const kingMoves = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
        kingMoves.forEach(([dr, dc]) => addMove(r+dr, c+dc));
    } else if (type === 'r' || type === 'b' || type === 'q') {
        const straight = [[-1,0], [1,0], [0,-1], [0,1]];
        const diagonal = [[-1,-1], [-1,1], [1,-1], [1,1]];
        const dirs = [];
        if (type === 'r' || type === 'q') dirs.push(...straight);
        if (type === 'b' || type === 'q') dirs.push(...diagonal);

        dirs.forEach(([dr, dc]) => {
            let nr = r + dr, nc = c + dc;
            while (addMove(nr, nc)) {
                nr += dr; nc += dc;
            }
        });
    } else if (type === 'p') {
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        const promRow = color === 'w' ? 0 : 7;

        if (r+dir>=0 && r+dir<8 && !board[r+dir][c]) {
            moves.push({r: r+dir, c: c, type: r+dir===promRow ? 'promotion' : 'normal'});
            if (r === startRow && !board[r+2*dir][c]) {
                moves.push({r: r+2*dir, c: c, type: 'normal'});
            }
        }

        for (let dc of [-1, 1]) {
            const nr = r+dir, nc = c+dc;
            if (nr>=0 && nr<8 && nc>=0 && nc<8) {
                if (board[nr][nc] && board[nr][nc].color !== color) {
                    moves.push({r: nr, c: nc, type: nr===promRow ? 'promotion' : 'normal', target: board[nr][nc]});
                } else if (enPassant && enPassant.r === nr && enPassant.c === nc) {
                    moves.push({r: nr, c: nc, type: 'enPassant'});
                }
            }
        }
    }

    return moves;
};

const getLegalMoves = (board, r, c, castling, enPassant) => {
    const p = board[r][c];
    if (!p) return [];
    const color = p.color;
    const oppColor = color === 'w' ? 'b' : 'w';

    let moves = getPseudoLegalMoves(board, r, c, enPassant);

    moves = moves.filter(m => {
        const newBoard = board.map(row => [...row]);
        newBoard[m.r][m.c] = newBoard[r][c];
        newBoard[r][c] = null;
        if (m.type === 'enPassant') {
            newBoard[r][m.c] = null;
        }
        
        let kr = -1, kc = -1;
        for (let i=0; i<8; i++) {
            for (let j=0; j<8; j++) {
                if (newBoard[i][j] && newBoard[i][j].type === 'k' && newBoard[i][j].color === color) {
                    kr = i; kc = j;
                }
            }
        }

        return !isSquareAttacked(newBoard, kr, kc, oppColor);
    });

    if (p.type === 'k') {
        const rights = castling[color];
        const baseRow = color === 'w' ? 7 : 0;
        
        if (rights.k && r === baseRow && c === 4) {
            if (!board[baseRow][5] && !board[baseRow][6] && board[baseRow][7] && board[baseRow][7].type === 'r') {
                if (!isSquareAttacked(board, baseRow, 4, oppColor) &&
                    !isSquareAttacked(board, baseRow, 5, oppColor) &&
                    !isSquareAttacked(board, baseRow, 6, oppColor)) {
                    moves.push({r: baseRow, c: 6, type: 'castling'});
                }
            }
        }
        if (rights.q && r === baseRow && c === 4) {
            if (!board[baseRow][3] && !board[baseRow][2] && !board[baseRow][1] && board[baseRow][0] && board[baseRow][0].type === 'r') {
                if (!isSquareAttacked(board, baseRow, 4, oppColor) &&
                    !isSquareAttacked(board, baseRow, 3, oppColor) &&
                    !isSquareAttacked(board, baseRow, 2, oppColor)) {
                    moves.push({r: baseRow, c: 2, type: 'castling'});
                }
            }
        }
    }

    return moves;
};

const checkKingInCheck = (board, color) => {
    const oppColor = color === 'w' ? 'b' : 'w';
    for (let i=0; i<8; i++) {
        for (let j=0; j<8; j++) {
            if (board[i][j] && board[i][j].type === 'k' && board[i][j].color === color) {
                return isSquareAttacked(board, i, j, oppColor);
            }
        }
    }
    return false;
};

const getAllLegalMoves = (board, color, castling, enPassant) => {
    const moves = [];
    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            if (board[r][c] && board[r][c].color === color) {
                const pieceMoves = getLegalMoves(board, r, c, castling, enPassant);
                pieceMoves.forEach(m => moves.push({...m, from: {r, c}}));
            }
        }
    }
    return moves;
};

const ChessGame = () => {
    const [board, setBoard] = useState(initialBoard);
    const [turn, setTurn] = useState('w');
    const [selected, setSelected] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [history, setHistory] = useState([]);
    const [captured, setCaptured] = useState({ w: [], b: [] });
    const [castling, setCastling] = useState({ w: { k: true, q: true }, b: { k: true, q: true } });
    const [enPassant, setEnPassant] = useState(null);
    const [status, setStatus] = useState('active'); // active, check, checkmate, stalemate
    const [promotionPending, setPromotionPending] = useState(null);

    useEffect(() => {
        const currentMoves = getAllLegalMoves(board, turn, castling, enPassant);
        const isCheck = checkKingInCheck(board, turn);
        
        if (currentMoves.length === 0) {
            setStatus(isCheck ? 'checkmate' : 'stalemate');
        } else if (isCheck) {
            setStatus('check');
        } else {
            setStatus('active');
        }
    }, [board, turn, castling, enPassant]);

    const getAlgebraic = (moveFrom, moveTo, moveType, piece, isCapture) => {
        const files = 'abcdefgh';
        const ranks = '87654321';
        if (moveType === 'castling') {
            return moveTo.c === 6 ? 'O-O' : 'O-O-O';
        }
        let pStr = piece.type === 'p' ? '' : piece.type.toUpperCase();
        let toStr = files[moveTo.c] + ranks[moveTo.r];
        let captureStr = isCapture ? 'x' : '';
        if (piece.type === 'p' && isCapture) pStr = files[moveFrom.c];
        return `${pStr}${captureStr}${toStr}`;
    };

    const executeMove = (from, to, type, promoteTo = null) => {
        const newBoard = board.map(row => [...row]);
        const piece = newBoard[from.r][from.c];
        let isCapture = false;
        let capturedPiece = newBoard[to.r][to.c];

        if (capturedPiece) isCapture = true;

        newBoard[from.r][from.c] = null;
        
        if (type === 'enPassant') {
            isCapture = true;
            capturedPiece = newBoard[from.r][to.c];
            newBoard[from.r][to.c] = null;
        } else if (type === 'castling') {
            if (to.c === 6) { // King side
                newBoard[to.r][5] = newBoard[to.r][7];
                newBoard[to.r][7] = null;
            } else { // Queen side
                newBoard[to.r][3] = newBoard[to.r][0];
                newBoard[to.r][0] = null;
            }
        } else if (promoteTo) {
            piece.type = promoteTo;
        }

        newBoard[to.r][to.c] = piece;

        // Update castling rights
        const newCastling = { w: {...castling.w}, b: {...castling.b} };
        if (piece.type === 'k') {
            newCastling[piece.color] = { k: false, q: false };
        } else if (piece.type === 'r') {
            if (from.r === 7 && from.c === 0) newCastling.w.q = false;
            if (from.r === 7 && from.c === 7) newCastling.w.k = false;
            if (from.r === 0 && from.c === 0) newCastling.b.q = false;
            if (from.r === 0 && from.c === 7) newCastling.b.k = false;
        }

        // Update En Passant
        let newEnPassant = null;
        if (piece.type === 'p' && Math.abs(to.r - from.r) === 2) {
            newEnPassant = { r: (to.r + from.r) / 2, c: from.c };
        }

        // Update captured pieces
        if (isCapture) {
            setCaptured(prev => ({
                ...prev,
                [turn]: [...prev[turn], capturedPiece]
            }));
        }

        // Update Move History
        let alg = getAlgebraic(from, to, type, {type: piece.type === promoteTo ? 'p' : piece.type, color: piece.color}, isCapture);
        if (promoteTo) alg += '=' + promoteTo.toUpperCase();
        
        const newHistory = [...history];
        if (turn === 'w') {
            newHistory.push({ w: alg, b: '' });
        } else {
            newHistory[newHistory.length - 1].b = alg;
        }

        setBoard(newBoard);
        setCastling(newCastling);
        setEnPassant(newEnPassant);
        setHistory(newHistory);
        setTurn(turn === 'w' ? 'b' : 'w');
        setSelected(null);
        setPossibleMoves([]);
        setPromotionPending(null);
    };

    const handleSquareClick = (r, c) => {
        if (status === 'checkmate' || status === 'stalemate' || promotionPending) return;

        const piece = board[r][c];
        
        // If clicked on a possible move
        const move = possibleMoves.find(m => m.r === r && m.c === c);
        if (move) {
            if (move.type === 'promotion') {
                setPromotionPending({ from: selected, to: move });
                return;
            }
            executeMove(selected, move, move.type);
            return;
        }

        // If clicked on own piece
        if (piece && piece.color === turn) {
            setSelected({r, c});
            setPossibleMoves(getLegalMoves(board, r, c, castling, enPassant));
        } else {
            setSelected(null);
            setPossibleMoves([]);
        }
    };

    const handlePromotion = (type) => {
        if (promotionPending) {
            executeMove(promotionPending.from, promotionPending.to, 'promotion', type);
        }
    };

    const resetGame = () => {
        setBoard(initialBoard.map(row => [...row]));
        setTurn('w');
        setSelected(null);
        setPossibleMoves([]);
        setHistory([]);
        setCaptured({ w: [], b: [] });
        setCastling({ w: { k: true, q: true }, b: { k: true, q: true } });
        setEnPassant(null);
        setStatus('active');
        setPromotionPending(null);
    };

    const renderBoard = () => {
        const squares = [];
        for (let r=0; r<8; r++) {
            for (let c=0; c<8; c++) {
                const isLight = (r + c) % 2 === 0;
                const piece = board[r][c];
                const isSelected = selected && selected.r === r && selected.c === c;
                const isPossibleMove = possibleMoves.find(m => m.r === r && m.c === c);
                const isKingInCheck = piece && piece.type === 'k' && piece.color === turn && status.includes('check');

                squares.push(
                    <div 
                        key={`${r}-${c}`}
                        onClick={() => handleSquareClick(r, c)}
                        className={`relative w-full h-full flex items-center justify-center text-4xl sm:text-5xl cursor-pointer select-none transition-colors duration-200
                            ${isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}
                            ${isSelected ? 'bg-yellow-300/80' : ''}
                            ${isKingInCheck ? 'bg-red-500/80' : ''}
                            ${isPossibleMove && !piece ? "after:content-[''] after:w-4 after:h-4 after:bg-green-600/60 after:rounded-full after:absolute" : ""}
                            ${isPossibleMove && piece ? "ring-4 ring-inset ring-green-600/60" : ""}
                        `}
                    >
                        {piece && (
                            <span className={`drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] ${piece.color === 'w' ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-black drop-shadow-[0_2px_2px_rgba(255,255,255,0.4)]'}`}>
                                {PIECES[piece.color + piece.type]}
                            </span>
                        )}
                        {c === 0 && <span className="absolute top-1 left-1 text-xs font-bold opacity-60 text-black">{8-r}</span>}
                        {r === 7 && <span className="absolute bottom-1 right-1 text-xs font-bold opacity-60 text-black">{String.fromCharCode(97+c)}</span>}
                    </div>
                );
            }
        }
        return squares;
    };

    const renderCaptured = (color) => {
        const caps = captured[color].sort((a,b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type]);
        return (
            <div className="flex flex-wrap gap-1 min-h-[32px] items-center">
                {caps.map((p, i) => (
                    <span key={i} className={`text-2xl ${p.color === 'w' ? 'text-white' : 'text-black'} opacity-80`}>
                        {PIECES[p.color + p.type]}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full items-start justify-center p-4 font-sans text-white">
            {/* Left Column: Game Info */}
            <div className="flex flex-col gap-6 w-full lg:w-80 bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2 tracking-tight">React Chess</h1>
                    <p className="text-gray-400 text-sm">Play locally with full rules engine</p>
                </div>
                
                <div className={`p-4 rounded-xl text-center font-bold text-xl tracking-wide shadow-inner border transition-colors duration-300
                    ${status === 'checkmate' ? 'bg-red-900/50 text-red-400 border-red-700' : 
                      status === 'check' ? 'bg-orange-900/50 text-orange-400 border-orange-700' : 
                      status === 'stalemate' ? 'bg-gray-700 text-gray-300 border-gray-600' : 
                      turn === 'w' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-900 text-gray-300 border-slate-800'}`}>
                    {status === 'checkmate' ? `${turn === 'w' ? 'Black' : 'White'} Wins by Checkmate!` :
                     status === 'stalemate' ? 'Draw by Stalemate' :
                     status === 'check' ? `${turn === 'w' ? 'White' : 'Black'} is in Check!` :
                     `${turn === 'w' ? "White" : "Black"}'s Turn`}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">White Captured</div>
                        {renderCaptured('w')}
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Black Captured</div>
                        {renderCaptured('b')}
                    </div>
                </div>

                <button 
                    onClick={resetGame}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                    New Game
                </button>
            </div>

            {/* Middle Column: The Board */}
            <div className="relative">
                <div className="w-[100vw] max-w-[500px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] aspect-square grid grid-cols-8 grid-rows-8 border-4 border-gray-900 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                    {renderBoard()}
                </div>
                
                {/* Promotion Overlay */}
                {promotionPending && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg z-10 backdrop-blur-sm">
                        <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700 text-center">
                            <h3 className="text-xl font-bold text-white mb-4">Promote Pawn</h3>
                            <div className="flex gap-4">
                                {['q', 'r', 'b', 'n'].map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => handlePromotion(type)}
                                        className="w-16 h-16 bg-gray-700 hover:bg-gray-600 rounded-xl text-4xl flex items-center justify-center transition-colors shadow-lg border border-gray-600"
                                    >
                                        <span className={turn === 'w' ? 'text-white' : 'text-black drop-shadow-md'}>
                                            {PIECES[turn + type]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Move History */}
            <div className="w-full lg:w-64 bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-700 h-64 lg:h-[600px] flex flex-col">
                <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Move History
                </h2>
                <div className="flex-1 overflow-y-auto pr-2 space-y-1 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {history.length === 0 ? (
                        <p className="text-gray-500 italic text-center mt-4">No moves yet</p>
                    ) : (
                        history.map((move, i) => (
                            <div key={i} className={`flex items-center p-2 rounded ${i%2===0 ? 'bg-gray-900/40' : 'bg-transparent'} hover:bg-gray-700/50 transition-colors`}>
                                <span className="w-8 text-gray-500 font-bold">{i+1}.</span>
                                <span className="w-20 text-blue-300">{move.w}</span>
                                <span className="w-20 text-emerald-300">{move.b}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChessGame;
