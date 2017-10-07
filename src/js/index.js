$(document).ready(function () {

    function draw() {
        var ctx = document.getElementById('canvas').getContext('2d');
        var fishbowl = new Image();
        fishbowl.onload = function () {
            ctx.drawImage(fishbowl, 0, 0);


            // draw water line
            var width = 200, height = 300;
            var waterlinePts = calcWaterline(width, height, 100, 0.5);
            ctx.beginPath();
            var startPos = 15;  // fishbowl has width
            ctx.moveTo(startPos, waterlinePts[0]);
            for (var t = 1; t < waterlinePts.length; t++) {
                ctx.lineTo(t + startPos, waterlinePts[t]);
            }
            ctx.strokeStyle= "rgba(25, 126, 255, 0.49)";
            ctx.lineWidth = 5;
            ctx.stroke();


        };
        fishbowl.src = '../css/fishbowl.png';

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

    draw();
});