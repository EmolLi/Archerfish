$(document).ready(function () {
    const canvasWidth = 700;
    const canvasHeight = 800;
    let g = 0.2;
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

    let bugMeta = {
        img: new Image(),
        collider: {
            xOffset: 15,
            yOffset: 25,
            width: 50,
            height: 30
        },
        baseSpeed: {
            x: 0.2,
            y: 0
        }
    };
    // let bugPic = new Image();
    let fish = {
        img: new Image(),
        x: 350, // used to draw fish on canvas
        y: 430,
        facingAngle: Math.PI / 2,
        facingAngleMin: Math.PI / 3,
        facingAngleMax: 2 * Math.PI / 3,
        facingDirection: 'right',
        collider: { // a circle, used for collision detection
            xOffset: 0,
            yOffset: 105,
            radius: 38
        }
    };
    let bubblesSize = [3, 5, 8];
    let bubbles = {};
    let bubbleBaseSpeed = 15;
    let isShootingBubble = false;


    let bugs = {};

    let waterlinePts;
    let waterlineStartPos = 30;

    // player control
    let fishSpeed = 3;
    let windSpeed = 3;
    let keyboardControl = {
        right: false,
        left: false,
        up: false,
        down: false,
        bubbles: false
    };
    const keymap = {
        a: 'left',
        d: 'right',
        w: 'up',
        s: 'down',
        ' ': 'bubbles'
    };

    function init() {
        fishbowl.img.src = './css/fishbowl.png';
        fish.img.src = './css/fish.png';
        bugMeta.img.src = './css/bug.png';

        // generate waterline pts
        let width = 500, height = 700;
        waterlinePts = calcWaterline(width, height, 100, 0.5);

        // generate bugs
        bugGeneration();
        windSpeedUpdate();

        window.requestAnimationFrame(draw);
    }

    function draw() {
        let ctx = document.getElementById('canvas').getContext('2d');
        ctx.clearRect(0, 0, 700, 700);

        ctx.translate(0, 100);
        ctx.drawImage(fishbowl.img, 0, 0, 600, 600 * fishbowl.img.height / fishbowl.img.width);

        // draw water line
        ctx.beginPath();
        let startPos = 30;  // fishbowl has width
        ctx.moveTo(startPos, waterlinePts[0]);
        for (let t = 1; t < waterlinePts.length; t++) {
            ctx.lineTo(t + startPos, waterlinePts[t]);
        }
        ctx.strokeStyle = "rgba(25, 126, 255, 0.49)";
        ctx.lineWidth = 5;
        ctx.stroke();


        // fishbowl size & position
        /**
        ctx.beginPath();
        ctx.arc(290, 230, 260, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(0, 0, 85, 65);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(0, 0, 470, 1);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(fish.x, fish.y + 5, 38, 0, 2 * Math.PI);
        ctx.stroke();**/

        // draw fish
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate(fish.facingAngle);

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
/**
            ctx.beginPath();
            // ctx.rect(b.x + 22, b.y + 30, 35, 20);
            ctx.rect(b.x + bugMeta.collider.xOffset, b.y + bugMeta.collider.yOffset, bugMeta.collider.width, bugMeta.collider.height);
            ctx.stroke();**/
        });


        // bubbles
        shootBubbles();
        calcBubblesPosition();
        _.forEach(bubbles, b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, 2 * Math.PI);
            ctx.stroke();
        });

        // clear all states
        _.forEach(_.keys(keyboardControl), s => keyboardControl[s] = false);


        // collision detection
        collisionDetection();

        window.requestAnimationFrame(draw);
    }


    /*
     * width and height are the overall width and height we have to work with, displace is
     * the maximum deviation value. This stops the terrain from going out of bounds if we choose
     */

    function calcWaterline(width, height, displace, roughness) {
        let points = [],
            // Gives us a power of 2 based on our width
            power = Math.pow(2, Math.ceil(Math.log(width) / (Math.log(2))));

        // Set the initial left point
        points[0] = height / 2 + (Math.random() * displace * 0.3) - displace * 0.3;
        // set the initial right point
        points[power] = height / 2 + (Math.random() * displace) - displace * 0.3;
        displace *= roughness;

        // Increase the number of segments
        for (let i = 1; i < power; i *= 2) {
            // Iterate through each segment calculating the center point
            for (let j = (power / i) / 2; j < power; j += power / i) {
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

        if (!isFishMovableArea()) {
            if (keyboardControl.up) fish.y += fishSpeed;
            if (keyboardControl.down) fish.y -= fishSpeed;
            if (keyboardControl.left) fish.x += fishSpeed;
            if (keyboardControl.right) fish.x -= fishSpeed;
        }
    }

    function shootBubbles() {
        if (isShootingBubble) keyboardControl.bubbles = false;
        if (keyboardControl.bubbles) {
            isShootingBubble = true;
            new Promise((resolve) => {
                for (let i = 1; i <= bubblesSize.length; i++) {
                    setTimeout(() => {
                        createBubble(bubblesSize[i - 1]);
                    }, 100 * i);
                }
                setTimeout(() => resolve(), bubblesSize.length * 200);
            }).then(() => isShootingBubble = false);
        }
    }


    function outOfScope(obj) {
        return obj.x < 0 || obj.x > canvasWidth || obj.y < 0 || obj.y > canvasHeight;
    }
    function calcBubblesPosition() {
        _.forEach(bubbles, b => {
            b.speed.y += g;

            b.x += b.speed.x;
            b.y += b.speed.y;
            if (outOfScope(b)) {
                delete bubbles[b.id];
                // console.log("delete bubble" + b.id);
            }

        })
    }


    function calcBugPosition() {
        _.forEach(bugs, b=> {
            // let b = bugs[bid];
            if (b.hit){
                b.speed = {x: b.speed.x, y: b.speed.y + g};
            }

            b.x += b.speed.x;
            // console.log(b.x);
            if (outOfScope(b)) {
                delete bugs[b.id];
                // console.log("delete bug" + b.id);
            }
            if (b.x >= canvasWidth) delete bugs[b.id];
            b.y += b.speed.y;
        });
    }


    let createBug = function () {
        let id = window.makeID();
        while (bugs.hasOwnProperty(id)) {    // make sure no duplicate id
            id = window.makeID();
        }
        bugs[id] = {
            img: bugMeta.img,
            // img: new Image(),
            x: 0,
            y: Math.random() * 30,
            id: id,
            speed: {x: bugMeta.baseSpeed.x + windSpeed * 0.1, y: 0}
        };
        // bug.img.src = '../css/bug.png';
    };

    let createBubble = function (size) {
        let id = window.makeID();
        while (bubbles.hasOwnProperty(id)) {
            id = window.makeID();
        }
        let bubble = {
            size: size,
            x: fish.x + fish.collider.xOffset - Math.cos(fish.facingAngle) * (fish.collider.radius + 5),
            y: fish.y + fish.collider.yOffset - Math.sin(fish.facingAngle)* (fish.collider.radius + 5),
            speed: {
                x: - Math.cos(fish.facingAngle) * bubbleBaseSpeed,
                y: - Math.sin(fish.facingAngle) * bubbleBaseSpeed
        },
            id: id
        };
        // console.log(bubble.y, waterlinePts[Math.floor(bubble.x - waterlineStartPos)]);
        if (bubble.y < waterlinePts[Math.floor(bubble.x - waterlineStartPos)] + 100){
            bubbles[bubble.id] = bubble;
            setTimeout(()=>{
                delete bubbles[bubble.id];
            }, 4000);
        }
        else {
            if (size == bubblesSize[0])
            alert("You are deep in the fishbowl, try swimming up to the water surface by pressing 'W'!");
        }
    };

    function keyDownHandler(event) {
        console.log(event.key);
        if (keymap[event.key]) {
            keyboardControl[keymap[event.key]] = true;
        }

        if (event.key == 'ArrowLeft') {
            if (fish.facingAngle > fish.facingAngleMin) fish.facingAngle -= Math.PI/180;
        }
        if (event.key == 'ArrowRight') {
            if (fish.facingAngle < fish.facingAngleMax) fish.facingAngle += Math.PI/180;
        }
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

            // upate bug speed
            _.forEach(bugs, b => {
                if (b.y < 100)  // influenced by wind if above tank
                    b.speed.x = bugMeta.baseSpeed.x + windSpeed * 0.1;}
                    );

            // upate bubble speed
            _.forEach(bubbleBaseSpeed, b => {
                if (b.y < 100)  // influenced by wind if above tank
                    b.speed.x = b.speed.x + windSpeed * 0.1;}
            );

            $('#windSpeed').text(windSpeed);
            windSpeedUpdate();
        }, time)
    }


    function isFishMovableArea() {
        let x = fish.x + fish.collider.xOffset;
        let y = fish.y + fish.collider.yOffset;
        // below waterline
        if (y < waterlinePts[Math.floor(fish.x + fish.collider.xOffset - waterlineStartPos)] + 100) {
            // console.log("out of water");
            return false;
        }
        // does not collide with fishbowl
        if (fishbowl.radius - Math.sqrt(Math.pow(x - fishbowl.originAbsX, 2) + Math.pow(y - fishbowl.originAbsY, 2)) < fish.collider.radius) {
            // console.log("collide with fishbowl");
            return false;
        }
        return true;
    }

    /**
     * treat bubble as a point
     */
    function bubbleCollisionDetection() {
        _.forEach(bubbles, b => {
            // encounter water
            if (b.y > waterlinePts[Math.floor(b.x - waterlineStartPos)] + 100){
                console.log("water");
                delete bubbles[b.id];
            }

            // fishbowl collision detection
            if (collisionDetectionWithFishBowl(b.x, b.y, true)){
                let collidedTime = Date.now();
                if (!b.collidedTime || collidedTime - b.collidedTime > 5){
                    b.speed = reflectedDirection({x: b.x, y:b.y}, b.speed, 0.9);
                    b.collidedTime = collidedTime;
                }
                console.log(b.x, b.y);
            }


            let bugID = collisionDetectionWithBugs(b.x, b.y);
            if (bugID) {
                // console.log(b.id + "hit bug " + bugID);
                delete bubbles[b.id];   // delete bubble
                bugs[bugID].hit = true;
            }



        })
    }


    function collisionDetection() {
        bubbleCollisionDetection();
        collisionDetectionWithFallingBugs();
    }

    /**
     *
     * @param x
     * @param y
     * @return null if it collided with no bug, else id of the bug
     */
    function collisionDetectionWithBugs(x, y) {
        for (let bid in bugs) {
            let b = bugs[bid];
            if (x > b.x + bugMeta.collider.xOffset &&
                x < b.x + bugMeta.collider.xOffset + bugMeta.collider.width &&
                y > b.y + bugMeta.collider.yOffset &&
                y < b.y + bugMeta.collider.yOffset + bugMeta.collider.height) {
                // console.log(b.id);
                return b.id;    // for sure it will only collide with one bug as bugs do not overlap
            }
        }
        return null;
    }

    function collisionDetectionWithFallingBugs() {
        for (let bid in bugs) {
            let b = bugs[bid];
            if (b.hit){
                let x = Math.floor(b.x + bugMeta.collider.xOffset + bugMeta.collider.width / 2);
                let y = b.y + bugMeta.collider.yOffset;
                // console.log(x, y);
                // encounter water
                if (y > waterlinePts[Math.floor(x - waterlineStartPos)] + 100){
                    console.log("water");
                    delete bugs[b.id];
                }


                // fishbowl collision detection
                if (collisionDetectionWithFishBowl(x, y, true)){
                    let collided = fishbowl.originAbsX - b.x < 0 ? 'right' : 'left';
                    if (!b.collided || b.collided != collided){
                        b.speed = reflectedDirection({x: b.x, y:b.y}, b.speed, 0.55);
                        b.collided = collided;
                    }
                    console.log(b.x, b.y);
                }
            }
            }
    };

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




    // reflection
    function reflectedDirection(reflectedPt, orignalSpeed, res) {
        // circle angle
        let a = Math.atan((1.0) * (fishbowl.originAbsY - reflectedPt.y) / (fishbowl.originAbsX - reflectedPt.x));
        // speed angle
        let b = Math.atan((1.0) * orignalSpeed.y / orignalSpeed.x);

        let newSpeedM = Math.sqrt(Math.pow(orignalSpeed.x, 2) + Math.pow(orignalSpeed.y, 2)) * res;

        let c = 2 * a - b - Math.PI/2;
        // if (c < - Math.PI) c -= Math.PI;
        return {
            x: (fishbowl.originAbsX - reflectedPt.x < 0) ? newSpeedM * Math.sin(c) : - newSpeedM * Math.sin(c),
            y:  (fishbowl.originAbsX - reflectedPt.x < 0) ? - newSpeedM * Math.cos(c): newSpeedM * Math.cos(c)
        }


    }

    init();

    // get mouse position -> collision detection test
    $('body').click(function (e) { //Default mouse Position
        console.log(e.pageX + ' , ' + e.pageY);
        // collisionDetectionWithBugs(e.pageX, e.pageY);
    });


    document.addEventListener('keydown', keyDownHandler, false);

});

