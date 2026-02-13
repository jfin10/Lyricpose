class Lyricpose{
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('best2048Score') || 0;
        this.size = 4;
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessage = document.getElementById('game-message');
        this.messageTitle = document.getElementById('message-title');
        this.messageText = document.getElementById('message-text');
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.updateScore();
        this.clearTiles();
        this.addNewTile();
        this.addNewTile();
        this.updateDisplay();
        this.hideMessage();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                const direction = e.key.replace('Arrow', '').toLowerCase();
                this.move(direction);
            }
        });
        
        // Button controls
        document.getElementById('new-game-btn').addEventListener('click', () => this.init());
        document.getElementById('try-again-btn').addEventListener('click', () => this.init());
        
        // Touch controls
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        const gameContainer = document.querySelector('.game-container');
        
        gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        gameContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: true });
    }
    
    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const minSwipeDistance = 50;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > minSwipeDistance) {
                if (diffX > 0) {
                    this.move('right');
                } else {
                    this.move('left');
                }
            }
        } else {
            if (Math.abs(diffY) > minSwipeDistance) {
                if (diffY > 0) {
                    this.move('down');
                } else {
                    this.move('up');
                }
            }
        }
    }
    
    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
            return randomCell;
        }
        return null;
    }
    
    move(direction) {
        const previousGrid = this.grid.map(row => [...row]);
        let moved = false;
        
        switch (direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }
        
        if (moved) {
            const newTile = this.addNewTile();
            this.updateDisplay(newTile);
            this.updateScore();
            
            if (this.checkWin()) {
                this.showMessage('You Win!', 'Congratulations! You reached 2048!');
            } else if (this.checkGameOver()) {
                this.showMessage('Game Over!', `Final Score: ${this.score}`);
            }
        }
    }
    
    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            const row = this.grid[i].filter(val => val !== 0);
            const merged = this.mergeRow(row);
            const newRow = merged.concat(Array(this.size - merged.length).fill(0));
            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            this.grid[i] = newRow;
        }
        return moved;
    }
    
    moveRight() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            const row = this.grid[i].filter(val => val !== 0);
            const merged = this.mergeRow(row.reverse()).reverse();
            const newRow = Array(this.size - merged.length).fill(0).concat(merged);
            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            this.grid[i] = newRow;
        }
        return moved;
    }
    
    moveUp() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            const column = [];
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== 0) {
                    column.push(this.grid[i][j]);
                }
            }
            const merged = this.mergeRow(column);
            const newColumn = merged.concat(Array(this.size - merged.length).fill(0));
            
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.grid[i][j] = newColumn[i];
            }
        }
        return moved;
    }
    
    moveDown() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            const column = [];
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== 0) {
                    column.push(this.grid[i][j]);
                }
            }
            const merged = this.mergeRow(column.reverse()).reverse();
            const newColumn = Array(this.size - merged.length).fill(0).concat(merged);
            
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.grid[i][j] = newColumn[i];
            }
        }
        return moved;
    }
    
    mergeRow(row) {
        const merged = [];
        let i = 0;
        while (i < row.length) {
            if (i < row.length - 1 && row[i] === row[i + 1]) {
                merged.push(row[i] * 2);
                this.score += row[i] * 2;
                i += 2;
            } else {
                merged.push(row[i]);
                i++;
            }
        }
        return merged;
    }
    
    updateDisplay(newTile = null) {
        this.clearTiles();
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] !== 0) {
                    const tile = this.createTile(this.grid[i][j], i, j);
                    
                    // Add animation class for new tiles
                    if (newTile && newTile.row === i && newTile.col === j) {
                        tile.classList.add('tile-new');
                    }
                    
                    this.tileContainer.appendChild(tile);
                }
            }
        }
    }
    
    createTile(value, row, col) {
        const tile = document.createElement('div');
        tile.className = `lyric-pose tile-${value}`;
        tile.textContent = value;
        tile.style.left = `${col * 110}px`;
        tile.style.top = `${row * 110}px`;
        return tile;
    }
    
    clearTiles() {
        this.tileContainer.innerHTML = '';
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreElement.textContent = this.bestScore;
            localStorage.setItem('best2048Score', this.bestScore);
        } else {
            this.bestScoreElement.textContent = this.bestScore;
        }
    }
    
    checkWin() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }
    
    checkGameOver() {
        // Check for empty cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    return false;
                }
            }
        }
        
        // Check for possible merges
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = this.grid[i][j];
                // Check right
                if (j < this.size - 1 && this.grid[i][j + 1] === current) {
                    return false;
                }
                // Check down
                if (i < this.size - 1 && this.grid[i + 1][j] === current) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    showMessage(title, text) {
        this.messageTitle.textContent = title;
        this.messageText.textContent = text;
        this.gameMessage.classList.add('show');
    }
    
    hideMessage() {
        this.gameMessage.classList.remove('show');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
