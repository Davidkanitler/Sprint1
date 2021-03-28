'use strict'
// Minesweeper GAME

const MINE = '💣';
const FLAG = '🚩';

var gBoard;
var gGameTimer;
var gUndoStateArray = [];

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    isEnd: false,
    lives: 1,
    isHint: false,
    isHintToggle: false,
    hintIdx: 0,
    safeClicks: 3,
    safeClickToggle: false
};

var gLevel = {
    level: 1,
    SIZE: 4,
    MINES: 2,
};

// Builds a board, renders it, initializes best score, lives, and undo array for a new game.
function initGame() {
    gBoard = buildBoard();
    renderBoard(gBoard);
    getBestScores();
    renderLives();
    gUndoStateArray = []; // clear the array in the beggining  of the game
}

// Loads the 1 before last item in the undo array and assigns it to gBoard & renders it.
function undo() {
    if (gUndoStateArray.length <= 1) return; // no moves to undo to
    gUndoStateArray.pop();
    var previousState = JSON.parse(gUndoStateArray[gUndoStateArray.length - 1]);
    gBoard = previousState;
    renderBoard(gBoard);
}

// Saves a clone version of gBoard into an undo array to be later used in undo function
function saveState() {
    var state = JSON.stringify(gBoard);
    gUndoStateArray.push(state);
}

// Sets and renders game level
function gameLevel(level) {
    switch (level) {
        case 1:
            gLevel.SIZE = 4;
            gLevel.MINES = 2;
            break
        case 2:
            gLevel.SIZE = 8;
            gLevel.MINES = 12;
            break
        case 3:
            gLevel.SIZE = 12;
            gLevel.MINES = 30;
            break
        default:
            return null;
    }
    gLevel.level = level;
    // update level buttons
    for (var i = 0; i < 3; i++) {
        var elLevel = document.querySelector(`.level-${i + 1}`);
        if (level === (i + 1)) {
            if (!elLevel.style.backgroundColor) {
                elLevel.style.backgroundColor = 'lightgray';
                continue;
            } else {
                continue;
            }
        }
        elLevel.style.backgroundColor = '';
    }
    playAgain();
}

function renderLives() {
    // update lives buttons
    for (var i = 0; i < 3; i++) {
        var elLives = document.querySelector(`.lives${i + 1}`);
        if (gGame.lives < i + 1) {
            elLives.style.backgroundColor = "lightgray";    
        } else if (gGame.lives === i + 1) {
            elLives.style.backgroundColor = "gray";
        } else {
            elLives.style.backgroundColor = "lightgray";
        }
    }
}

// Sets and renders game lives.
function setLives(lives) {
    if (gGame.isEnd) return;
    if (!gGame.isOn && lives) {
        switch (lives) {
            case 1:
                gGame.lives = 1;
                break
            case 2:
                gGame.lives = 2;
                break
            case 3:
                gGame.lives = 3;
                break
            default:
                return null;
        }
    }
    renderLives();
}

function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([]);
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board;
}

function setRandomMines(cellI, cellJ) {
    var nums = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (i === cellI && j === cellJ) continue;
            var emptyCells = { i: i, j: j };
            nums.push(emptyCells);
        }
    }
    for (var i = 0; i < gLevel.MINES; i++) {
        var mineCell = drawNum(nums);
        gBoard[mineCell.i][mineCell.j].isMine = true;
    }
}

// In charge of rendering the HTML elements using the gBoard variable
// Used in initGame and undo
function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var className = 'cell cell' + i + '-' + j;
            strHTML += `<td class="${className}" onclick="cellClicked(this, ${i}, ${j})"
            oncontextmenu="cellMarked(this, ${i}, ${j});return false;">
            </td>`;
        }
        strHTML += '</tr>';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;
    
    // Render each cell in the board (mainly used for undo scenario)
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            renderCell(i, j)
        }
    }
}

// In charge of rendering the html for a single cell positioned in gBoard[i][j]
function renderCell(i, j) {
    var cell = gBoard[i][j];
    var value = "";

    if (cell.isMarked) { // If the cell is marked, value should be a flag
        value = FLAG;
    } else if (!cell.isShown && !(gGame.isHint && cell.hintIdx === gGame.hintIdx)) {
        // If the cell is not shown and the we are not in "hint mode" and the cell is not a hint
        // Put no value in the cell so that it won't show
        value = "";
    } else if (cell.isMine) {
        value = MINE;
    }
    else if (!cell.minesAroundCount) {
        // If there are no 
        value = ' ';
    } else if (cell.minesAroundCount) {
        value = cell.minesAroundCount;
    }

    var elCell = document.querySelector(`.cell${i}-${j}`);
    if (value !== FLAG && value) {
        elCell.style.backgroundColor = "gray";
        if (gGame.isHintToggle) {
            elCell.style.backgroundColor = "lightgray"; // back to as same as the board 
        }
        if (gGame.safeClickToggle) {
            elCell.style.backgroundColor = "lightgray";
        }
    } else {
        elCell.style.backgroundColor = "lightgray";
    }
    elCell.innerHTML = value;
}

function cellClicked(elCell, i, j) {
    if (gGame.isEnd) return;
    if (!gGame.isOn) { 
        // first click on the game indicates that it started. set up mines, timer and save state:
        setRandomMines(i, j);
        setMinesNegsCount(gBoard);
        countUpTimer();
        saveState();
    }
    gGame.isOn = true;
    if (elCell.innerText !== '') return; //
    if (gGame.isHint) {
        hintPressed(i, j);
        return;
    }
    if (gGame.safeClickToggle) return;
    if (gBoard[i][j].isMine) {
        if (gGame.lives) {
            gGame.lives--;
            showMineAlert();
            renderLives();
            return;
        }
        renderLives();
        revealMines();
        gameOver(false);
        return;
    } else if (gBoard[i][j].minesAroundCount) {
        gGame.shownCount++;
    } else if (!gBoard[i][j].minesAroundCount) {
        expandShownFull(gBoard, i, j);
        return;
    }
    gBoard[i][j].isShown = true;
    renderCell(i, j);
    checkGameOver();
    saveState(); // save the state.. 
}

function hintPressed(i, j) {
    if (gGame.isHintToggle) return;
    expandShownFull(gBoard, i, j);
    gGame.isHintToggle = true;
    setTimeout(function() {
        gGame.isHint = false;
        gGame.isHintToggle = false;
        expandShownFull(gBoard, i, j, true);
        var elHint = document.querySelector(`.hint${gGame.hintIdx}`);
        elHint.style.visibility = 'hidden';
    }, 1000);
}

function revealMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            gBoard[i][j].isShown = true;
            if (gBoard[i][j].isMine) renderCell(i, j);
        }
    }
}

function setMinesNegsCount(board) {
    for (var cellI = 0; cellI < board.length; cellI++) {
        for (var cellJ = 0; cellJ < board[0].length; cellJ++) {
            for (var i = cellI - 1; i <= cellI + 1; i++) {
                if (i < 0 || i >= board.length) continue;
                for (var j = cellJ - 1; j <= cellJ + 1; j++) {
                    if (i === cellI && j === cellJ) continue;
                    if (j < 0 || j >= board[0].length) continue;
                    if (board[i][j].isMine) board[cellI][cellJ].minesAroundCount++;
                }
            }
        }
    }
    return board;
}

function cellMarked(elCell, i, j) {
    if (gGame.isEnd) return;
    if (!gGame.isOn) {
        setRandomMines(i, j);
        setMinesNegsCount(gBoard);
        countUpTimer();
    }
    gGame.isOn = true;

    if (elCell.innerText !== FLAG) {
        if (elCell.innerText !== '') return;
        gBoard[i][j].isMarked = true;
        gGame.markedCount++;
    } else {
        gBoard[i][j].isMarked = false;
        gGame.markedCount--;
    }
    renderCell(i, j);
    checkGameOver();
}

function checkGameOver() {
    if ((gGame.shownCount + gGame.markedCount) === (gLevel.SIZE * gLevel.SIZE) &&
        gGame.markedCount === gLevel.MINES) {
        gameOver(true);
    }
}

function gameOver(isWin) {
    gGame.isOn = false;
    gGame.isEnd = true;
    clearInterval(gGameTimer);
    gGameTimer = null;
    if (isWin) {
        var elStartBtn = document.querySelector('.start');
        elStartBtn.innerText = '😎';
        setBestScore();
    } else {
        var elStartBtn = document.querySelector('.start');
        elStartBtn.innerText = '🤯';
    }
}

function playAgain() {
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        isEnd: false,
        lives: 0,
        isHint: false,
        isHintToggle: false,
        hintIdx: 0,
        safeClicks: 3,
        safeClickToggle: false
    };
    clearInterval(gGameTimer);
    gGameTimer = null;
    var elGameTimer = document.querySelector('.minutes');
    elGameTimer.innerText = '00';
    var elGameTimer = document.querySelector('.seconds');
    elGameTimer.innerText = '00';
    var elStartBtn = document.querySelector('.start');
    elStartBtn.innerText = '😀';
    for (var i = 1; i < 4; i++) {
        var elHint = document.querySelector(`.hint${i}`);
        elHint.innerText = '💡';
        elHint.style.visibility = 'visible'
        elHint.style.display = 'inline-block';
    }
    for (var i = 0; i < 3; i++) {
        var elLives = document.querySelector(`.lives${i + 1}`);
        elLives.style.backgroundColor = '';
    }
    var elSafe = document.querySelector('.safe-click span');
    elSafe.innerText = 3;
    initGame();
}
// recursion
function expandShownFull(board, cellI, cellJ, hintHideMode) {
    var value;
    // debugger;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= board[i].length) continue;
            if (board[i][j].isShown || board[i][j].isMarked) continue;
            if (gGame.isHint) {
                gBoard[i][j].hintIdx = gGame.hintIdx;
            } else if (!hintHideMode) {
                gBoard[i][j].isShown = true;
                gGame.shownCount++;
            }
            renderCell(i, j);
            if (gGame.isHint || hintHideMode) continue;
            if (!board[i][j].minesAroundCount) {
                if (i === cellI && j === cellJ) continue; // except the cell i clicked
                expandShownFull(board, i, j); // the recursion 
            }
        }
    }

}

function showMineAlert() {
    var elMineAlert = document.querySelector('.mine-alert');
    elMineAlert.style.display = 'block';
    setTimeout(function() {
        elMineAlert.style.display = 'none';
    }, 1000);
}

function getHint(elHint, idx) {
    if (!gGame.isOn) return;
    if (gGame.isEnd) return;
    if (gGame.isHint) return;
    if (gGame.safeClickToggle) return;
    if ((gGame.shownCount + gGame.markedCount) === (gLevel.SIZE * gLevel.SIZE)) return;
    gGame.isHint = true;
    gGame.hintIdx = idx;
    elHint.innerText = '💥';
}

function getBestScores() {
    var classNames = ['.beginner', '.medium', '.expert'];
    for (var i = 0; i < classNames.length; i++) {
        if (!localStorage.getItem(`level${i + 1}`)) continue;
        var elBestScore = document.querySelector(classNames[i]);
        elBestScore.innerText = localStorage.getItem(`level${i + 1}`);
    }
}

function setBestScore() {
    var className;
    var idx;
    if (typeof(Storage) !== "undefined") {

        switch (gLevel.SIZE) {
            case 4:
                className = '.beginner';
                idx = 1;
                break
            case 8:
                className = '.medium';
                idx = 2;
                break
            case 12:
                className = '.expert';
                idx = 3;
                break
            default:
                return null;
        }
        if (!localStorage.getItem(`level${idx}`)) { // if there are no storage 
            localStorage.setItem(`level${idx}`, gGame.secsPassed); // set storage 
        } else if (gGame.secsPassed < localStorage.getItem(`level${idx}`)) {
            localStorage.setItem(`level${idx}`, gGame.secsPassed);
        } else return;
        // Retrieve from storage and update
        var elBestScore = document.querySelector(className);
        elBestScore.innerText = localStorage.getItem(`level${idx}`);
    } else return;
}

function resetBestScores() {
    var classNames = ['.beginner', '.medium', '.expert'];
    for (var i = 0; i < classNames.length; i++) {
        localStorage.removeItem(`level${i + 1}`);
        var elBestScore = document.querySelector(classNames[i]);
        elBestScore.innerText = 0;
    }
}

function safeClick() {
    if (!gGame.isOn) return;
    if (gGame.isEnd) return;
    if (gGame.isHint) return;
    if (gGame.safeClickToggle) return;
    if (gGame.safeClicks === 0) return;
    var value;
    var nums = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine || gBoard[i][j].isShown || gBoard[i][j].isMarked) continue;
            var safeCells = { i: i, j: j };
            nums.push(safeCells);
        }
    }
    var safeCell = drawNum(nums);
    if (!safeCell) return;
    gBoard[safeCell.i][safeCell.j].isShown = true;
    renderCell(safeCell.i, safeCell.j);
    gGame.safeClicks--;
    gGame.safeClickToggle = true;
    var elSafe = document.querySelector('.safe-click span');
    elSafe.innerText = gGame.safeClicks;
    setTimeout(function() {
        gBoard[safeCell.i][safeCell.j].isShown = false;
        renderCell(safeCell.i, safeCell.j);
        gGame.safeClickToggle = false;
    }, 1000);
}