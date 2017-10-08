$(document).ready(function () {
    let fishbowl = new Image();
    let fish = {
        img: new Image(),
        x: 400,
        y: 400,
        facingDirection: 'right'
    };
    let waterlinePts;

    // player control
    let fishSpeed = 3;
    let keyboardControl = {
        right: false,
        left: false,
        up: false,
        down: false
    };
    const keymap = {
        a: 'left',
        d: 'right',
        w: 'up',
        s: 'down'
    };

    function init() {
        fishbowl.src = '../css/fishbowl.png';
        fish.img.src = '../css/fish.png';

        var width = 500, height = 700;
        waterlinePts = calcWaterline(width, height, 100, 0.5);
        window.requestAnimationFrame(draw);
    }

    function draw() {
        var ctx = document.getElementById('canvas').getContext('2d');
        ctx.clearRect(0, 0, 700, 700);

        ctx.drawImage(fishbowl, 0, 0, 600, 600 * fishbowl.height / fishbowl.width);

        // draw water line
        ctx.beginPath();
        var startPos = 30;  // fishbowl has width
        ctx.moveTo(startPos, waterlinePts[0]);
        for (var t = 1; t < waterlinePts.length; t++) {
            ctx.lineTo(t + startPos, waterlinePts[t]);
        }
        ctx.strokeStyle = "rgba(25, 126, 255, 0.49)";
        ctx.lineWidth = 5;
        ctx.stroke();

        // draw fish
        ctx.save();
        ctx.translate(fish.x, fish.y);
        if (fish.facingDirection == 'left'){
            ctx.rotate( Math.PI / 3);
        }
        if (fish.facingDirection == 'right'){
            ctx.rotate( 2 * Math.PI / 3);
        }
        // ctx.translate(fishX, fishY);
        ctx.drawImage(fish.img, -30, -20, 80, 80 * fish.img.height / fish.img.width);

        ctx.restore();

        calcFishPosition();
        // fishX += 1;
        // fishX += 1.73205;
        // fishY += 0.5;
        window.requestAnimationFrame(draw);
}


/*
 * width and height are the overall width and height we have to work with, displace is
 * the maximum deviation value. This stops the terrain from going out of bounds if we choose
 */

function calcWaterline(width, height, displace, roughness) {
    var points = [],
        // Gives us a power of 2 based on our width
        power = Math.pow(2, Math.ceil(Math.log(width) / (Math.log(2))));

    // Set the initial left point
    points[0] = height / 2 + (Math.random() * displace * 0.3) - displace * 0.3;
    // set the initial right point
    points[power] = height / 2 + (Math.random() * displace) - displace * 0.3;
    displace *= roughness;

    // Increase the number of segments
    for (var i = 1; i < power; i *= 2) {
        // Iterate through each segment calculating the center point
        for (var j = (power / i) / 2; j < power; j += power / i) {
            points[j] = ((points[j - (power / i) / 2] + points[j + (power / i) / 2]) / 2);
            points[j] += (Math.random() * displace * 2) - displace
        }
        // reduce our random range
        displace *= roughness;
    }
    return points;
}

function calcFishPosition() {
    if (keyboardControl.up) fish.y -= fishSpeed;
    if (keyboardControl.down) fish.y += fishSpeed;
    if (keyboardControl.left) fish.x -= fishSpeed;
    if (keyboardControl.right) fish.x += fishSpeed;


    // clear all statese
    _.forEach(_.keys(keyboardControl), s => keyboardControl[s] = false);
}

function keyDownHandler(event){
    // console.log(event.key);
    if (keymap[event.key]){
        keyboardControl[keymap[event.key]] = true;
    }

    if (event.key == 'ArrowLeft'){
        fish.facingDirection = 'left';
    }
    if (event.key == 'ArrowRight'){
        fish.facingDirection = 'right';
    }
    // console.log(keyboardControl);
}

    init();
    document.addEventListener('keydown', keyDownHandler, false);

});

