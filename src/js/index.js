$(document).ready(function () {
    const canvasWidth = 700;
    let fishbowl = {
        img: new Image(),
        originAbsX: 290,
        originAbsY: 330,
        radius: 260,
        leftOpeningAbsX: 85,
        leftOpeningAbsY: 165,
        rightOpeningAbsX: 470,
        rightOpeningAbsY: 101
    };

    let bugPic = new Image();
    let fish = {
        img: new Image(),
        x: 400,
        y: 400,
        facingDirection: 'right'
    };
    let bugs = {};

    let waterlinePts;

    // player control
    let fishSpeed = 3;
    let windSpeed = 3;
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
        fishbowl.img.src = '../css/fishbowl.png';
        fish.img.src = '../css/fish.png';
        bugPic.src = '../css/bug.png';

        // generate waterline pts
        let width = 500, height = 700;
        waterlinePts = calcWaterline(width, height, 100, 0.5);

        // generate bugs
        bugGeneration();
        windSpeedUpdate();

        window.requestAnimationFrame(draw);
    }

    function draw() {
        var ctx = document.getElementById('canvas').getContext('2d');
        ctx.clearRect(0, 0, 700, 700);

        ctx.translate(0, 100);
        ctx.drawImage(fishbowl.img, 0, 0, 600, 600 * fishbowl.img.height / fishbowl.img.width);

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


        // fishbowl size & position
        ctx.beginPath();
        ctx.arc(290, 230, 260, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(0, 0, 85, 65);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(0, 0, 470, 1);
        ctx.stroke();

        // draw fish
        ctx.save();
        ctx.translate(fish.x, fish.y);
        if (fish.facingDirection == 'left') {
            ctx.rotate(Math.PI / 3);
        }
        if (fish.facingDirection == 'right') {
            ctx.rotate(2 * Math.PI / 3);
        }
        // ctx.translate(fishX, fishY);
        ctx.drawImage(fish.img, -30, -20, 80, 80 * fish.img.height / fish.img.width);

        ctx.restore();
        calcFishPosition();

        // draw bugs
        ctx.translate(0, -100); // bug is above the fishbowl
        calcBugPosition();
        // console.log(bugs);
        _.forEach(bugs, b => {
            ctx.drawImage(b.img, b.x, b.y, 80, 80 * b.img.height / b.img.width);
        });

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

    function calcBugPosition() {
        _.forEach(_.keys(bugs), b => {
            bugs[b].x += windSpeed * 0.1;
            if (bugs[b].x >= canvasWidth) delete bugs[b];
        });
    }


    let createBug = function () {
        let id = window.makeID();
        while (bugs.hasOwnProperty(id)) {    // make sure no duplicate id
            id = window.makeID();
        }
        let bug = {
            img: bugPic,
            // img: new Image(),
            x: 0,
            y: Math.random() * 30,
            id: id
        };
        // bug.img.src = '../css/bug.png';
        bugs[id] = bug;
    };

    function keyDownHandler(event) {
        // console.log(event.key);
        if (keymap[event.key]) {
            keyboardControl[keymap[event.key]] = true;
        }

        if (event.key == 'ArrowLeft') {
            fish.facingDirection = 'left';
        }
        if (event.key == 'ArrowRight') {
            fish.facingDirection = 'right';
        }
        // console.log(keyboardControl);
    }

    // a bug is generated every 3-5 secs
    function bugGeneration() {
        let time = Math.random() * 3000 + 2000;
        setTimeout(() => {
            createBug();
            bugGeneration();
        }, time);
    }

    function windSpeedUpdate() {
        let time = Math.random() * 1000 + 1000;
        setTimeout(() => {
            windSpeed = Math.random() * 8 + 2;
            $('#windSpeed').text(windSpeed);
            windSpeedUpdate();
        }, time)
    }


    /**
     * collision detection
     * check if the point collides with the fishbowl
     * @param x
     * @param y
     * @param isInside is the point is inside the fishbowl at first (then collision is detected if the point now is outside, vice versa
     */
    function collisionDetectionWithFishBowl(x, y, isInside) {
        // use a circle to represent the fishbowl.
        // origin (290, 230 + 100)  // 100 is the translation
        // radius 260

        // is point inside the circle
        let disToOrigin = Math.sqrt(Math.pow(x - fishbowl.originAbsX, 2) + Math.pow(y - fishbowl.originAbsY, 2));
        if (isInside) {
            if (disToOrigin > fishbowl.radius
                && ((x < fishbowl.leftOpeningAbsX && y > fishbowl.leftOpeningAbsY)
                || (x > fishbowl.rightOpeningAbsX && y > fishbowl.rightOpeningAbsY)
                || (y > fishbowl.originAbsY))   // opening at the top,but not at the bottom
            ) {
                console.log("collision detected");
                return true;
            }
        }
        else {
            console.log("in");
        }
        return false;
    }

    init();

    // get mouse position -> collision detection test
    $('body').click(function (e) { //Default mouse Position
        console.log(e.pageX + ' , ' + e.pageY);
        collisionDetectionWithFishBowl(e.pageX, e.pageY, true);
    });


    document.addEventListener('keydown', keyDownHandler, false);

});

