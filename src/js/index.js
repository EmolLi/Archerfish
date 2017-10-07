$(document).ready(function () {
    var fishbowl = new Image();
    var fish = new Image();
    var waterlinePts;

    function init() {
        fishbowl.src = '../css/fishbowl.png';
        fish.src = '../css/fish.png';

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
        ctx.rotate( Math.PI / 3);
        ctx.translate(400, 30);
        ctx.drawImage(fish, -30, -20, 120, 120 * fish.height / fish.width);

        ctx.restore();
        window.requestAnimationFrame(draw);
};


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

    init();

})
;