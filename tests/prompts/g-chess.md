Build a complete chess game for one human against a computer opponent.
- 100% legal rules: all piece moves, check, checkmate, stalemate, castling (both sides, with its conditions), en passant, pawn promotion (with a piece choice dialog), threefold repetition and the fifty-move rule, and legal-move highlighting.
- A bot using minimax with alpha-beta pruning, move ordering and a reasonable evaluation (piece-square tables), at least 3 difficulty levels, thinking asynchronously so the UI never freezes (use a Web Worker created from a Blob).
- Drag-and-drop and click-to-move, animated moves, last-move highlight, captured pieces and material difference, a move list in algebraic notation, undo, new game as white or black, board flip, and a clean drawn piece set (SVG, no images).
