function drawNum(nums) {
    var idx = getRandomInt(0, nums.length);
    var num = nums[idx];
    nums.splice(idx, 1);
    return num;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive 
}

function countUpTimer() {
    gGameTimer = setInterval(setTime, 1000);
}

function setTime() {
    ++gGame.secsPassed;
    var elSeconds = document.querySelector('.seconds');
    var elMinutes = document.querySelector('.minutes');
    elSeconds.innerHTML = pad(gGame.secsPassed % 60);
    elMinutes.innerHTML = pad(parseInt(gGame.secsPassed / 60));
}

function pad(val) {
    var valString = val + '';
    if (valString.length < 2) {
        return '0' + valString;
    } else {
        return valString;
    }
}