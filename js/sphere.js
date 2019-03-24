/* Drawing util functions */

/**
 * Draw a solid-color circle. Equivalent to `ctx.fillRect()`, but for circles!
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x        x coordinate of the center point of the circle
 * @param {Number} y        y coordinate of the center point of the circle
 * @param {Number} r        radius of the circle in pixels
 * @param {String} color    Fill color of the circle
 */
function fillCircle(ctx, x, y, r, color) {
    var oldFS = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = oldFS;
}

/**
 * Fill a circle with a radial gradient.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x        x coordinate of the center point of the circle
 * @param {Number} y        y coordinate of the center point of the circle
 * @param {Number} r        radius of the circle in pixels
 * @param {String} color1   Start color for the gradient
 * @param {String} color2   End color for the gradient
 */
function fillCircleGradient(ctx, x, y, r, color1, color2) {
    var oldFS = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.closePath();
    // create radial gradient
    var grd = ctx.createRadialGradient(x-r/5, y-r/5, 0, x-r/5, y-r/5, r*0.8);
    // light blue
    grd.addColorStop(0, color1);
    // dark blue
    grd.addColorStop(1, color2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.fillStyle = oldFS;
}



/**
 * @class Dot
 * The Dot class represents one point on the surface of sphere.
 * Each Dot is displayed as a smaller sphere attached to its point.
 *
 * When drawn to the canvas, each dot is considered to be either in
 * the foreground or the background. This is determined by the Sphere
 * object, but basically, if its Z value is less than that of the
 * sphere's origin (center) point, it is in the background. Otherwise,
 * it is in the foreground.
 *
 * If in the foreground, the dot has a 10 pixel radius and is drawn with
 * a dark color. If in the background, the dot has a 5 pixel radius and
 * is drawn with a very light color, with those furthest back being almost
 * invisible. This gives the illusion of depth.
 *
 * @member {Number} x       The x coordinate of the dot
 * @member {Number} y       The y coordinate of the dot
 * @member {Number} z       The z coordinate of the dot
 * @member {Boolean} fg     Flag indicating whether the dot is in the foreground
 * @member {String} fgcolor The color to use if fg == true.
 * @member {String} bgcolor The color to use if fg == false.
 */
class Dot {
    constructor({x=0, y=0, z=0, fg=true, fgColor='#7EE37E', bgColor='#787878'}={}) {
        Object.assign(this, {x, y, z, fg, fgColor, bgColor});
    }

    draw(ctx) {
        // Store the context's fillStyle
        var tmpStyle = ctx.fillStyle;
        // Set the fillStyle for the dot
        ctx.fillStyle = (this.fg ? this.fgColor : this.bgColor);
        // Draw the dot
        fillCircle(ctx, x,y,this.fg?10:5);
        // Restore the previous fillStyle
        ctx.fillStyle = tmpStyle;
    }
}

/**
 * @class Sphere
 * The Sphere class represents the sphere object itself. It is basically
 * comprised of a set of points on its surface and various numbers to keep track
 * of how it should be drawn next.
 *
 * When drawn to the canvas, the dot list is dynamically sorted by Z-value and
 * drawn back-to-front, so that the foremost dots are consistently drawn on top
 * of those behind them. The further back a dot is (i.e. the lower its z-value)
 * the lighter it is colored. This way, those in back blend into the background,
 * becoming almost invisible.
 *
 * @member {Number} x       The x coordinate of the center of the sphere
 * @member {Number} y       The y coordinate of the center of the sphere
 * @member {Number} z       The z coordinate of the center of the sphere
 * @member {Number} r       Radius of the sphere.
 * @member {Number} circleSize  Radius of the dots to be drawn.
 * @member {Boolean} drawSpheres    Flag indicating whether surface Dots should
 *                                  be drawn as spheres or points.
 * @member {Array.<Array.<Dot>>} points     2D array of Dots on the surface of
 *                                          the sphere
 * @member {CanvasRenderingContext2D} ctx   Canvas context with which to draw
 */
class Sphere {
    constructor({ctx, x=200, y=200, z=0, r=90, drawSpheres=false}={}) {
        Object.assign(this, {ctx, x, y, z, r, drawSpheres});

        this.canvas = ctx.canvas;

        // 10 pixel dots
        this.circleSize = 10;

        // The angle delta to use when calculating the surface point positions;
        // a larger angstep means fewer points on the surface
        const angstep = Math.PI/10;
        this.points = [];
        // Loop from 0 to 2*pi, creating one row of points at each step
        for (let angxy=0; angxy<2*Math.PI; angxy+=angstep){
            const row = [];
            for (let angyz=0; angyz<2*Math.PI; angyz+=angstep) {
                // Loop from 0 to 2*pi, creating one point at each step
                row.push(new Dot({
                    x: r * Math.cos(angxy) * Math.sin(angyz) + x,
                    y: r * Math.sin(angxy) * Math.sin(angyz) + y,
                    z: r * Math.cos(angyz) + z,
                    fg: Math.cos(angyz) > 0
                }));
            }
            this.points.push(row);
        }
    }

    /** Draw to the canvas */
    draw() {
        // Store the context's fillStyle
        var tmpStyle = this.ctx.fillStyle;


        // Clear the canvas
        this.canvas.width -= 1;
        this.canvas.width += 1;

        // Set the canvas background color
        this.ctx.fillStyle = '#FFF';
        // Fill the canvas with the selected background color
        this.ctx.fillRect (0, 0, this.canvas.width, this.canvas.height);

        // Sort the points by z-value

        // Empty array
        var z_sorted = new Array();
        // Add each surface point first
        for (var i=0; i<this.points.length; i++) {
            for (var j=0; j<this.points[i].length; j++) {
                z_sorted[this.points.length*i+j] = this.points[i][j];
            }
        }
        // Add the origin point of the sphere
        z_sorted[z_sorted.length] = new Dot(this.x, this.y, this.z);
        z_sorted.sort(function(a,b){return (b.z-a.z)});


        for (var p=0; p<z_sorted.length; p++) {
            var color;
            // If drawing the origin point, draw it blue
            if (z_sorted[p].x == this.x && z_sorted[p].y == this.y && z_sorted[p].z == this.z) {
                color = "#27F";
            }
            // Else, draw the point a shade of gray relative to the z-value,
            // with darker pixels in the front and lighter pixels farther back
            else {
                var n = Math.round(((z_sorted[p].z + this.r)/(this.r*2)) * 250);

                color = "rgb(" + n + "," + n + "," + n + ")";
            }

            if (this.drawSpheres) {
                fillCircleGradient(this.ctx, z_sorted[p].x, z_sorted[p].y, this.circleSize, "#FFFFFF", color);
            }
            else {
                fillCircle(this.ctx, z_sorted[p].x, z_sorted[p].y, this.circleSize, color);
            }
        }

        // Restore the context's fillStyle
        this.ctx.fillStyle = tmpStyle;
    }

    // Zoom in or out (ctrl drag)
    zoom(x,y) {
        var length = Math.round(Math.sqrt(x*x + y*y)),
            scale = (this.r + (x>0 ? length : -length)) / this.r;


        this.x *= scale;
        this.y *= scale;
        this.z *= scale;

        this.r *= scale;
        this.circleSize *= scale;

        // Scale each point
        for (var i in this.points) {
            for (var j in this.points[i]) {
                this.points[i][j].x *= scale;
                this.points[i][j].y *= scale;
                this.points[i][j].z *= scale;
            }
        }
        // Redraw in new positions
        this.draw();
    }

    // Split pan!  (Hidden function, alt+shift drag)
    hiddenFun1(x,y) {
        this.r += Math.round(Math.sqrt(x*x + y*y));
        // Scale each point
        for (var i in this.points) {
            for (var j in this.points[i]) {
                this.points[i][j].x += (this.points[i][j].x > this.x ? x : -x);
                this.points[i][j].y += (this.points[i][j].y > this.y ? y : -y);
            }
        }
        // Redraw in new positions
        this.draw();
    }

    // Cigar Zoom!  (Hidden function, alt+ctrl drag)
    hiddenFun2(x,y) {
        var length = Math.round(Math.sqrt(x*x + y*y)),
            scale = (r + (x>0?length:-length))/r;

        this.r += length;

        this.x *= scale;
        this.y *= scale;
        //this.z *= scale;


        // Scale each point
        for (var i in this.points) {
            for (var j in this.points[i]) {
                this.points[i][j].x *= scale;
                this.points[i][j].y *= scale;
            }
        }
        // Redraw in new positions
        this.draw();
    }


    // Pan  (shift drag)
    pan(x,y) {
        // Move each point
        for (var i in this.points) {
            for (var j in this.points[i]) {
                this.points[i][j].x += x;
                this.points[i][j].y += y;
            }
        }
        this.x += x;
        this.y += y;
        // Redraw in new positions
        this.draw();
    }

    // Rotate the sphere (drag with no modifier keys)
    rotate(x,y) {
        // Vertical rotation
        this.rotateXZ(((Math.PI/2)/this.r)*x);
        // Horizontal rotation
        this.rotateYZ(((Math.PI/2)/this.r)*y);

        // Redraw in new positions
        this.draw();
    }

    // Rotate around the z-axis
    rotateXY(ang) {
        //console.log("XY test: ",ang);
        for (var i in this.points) {
            for (var j in this.points[i]) {
                var px = this.points[i][j].x - this.x,
                    py = this.points[i][j].y - this.y;

                var newx = px*Math.cos(ang)-py*Math.sin(ang),
                    newy = px*Math.sin(ang)+py*Math.cos(ang);

                this.points[i][j].x = newx+this.x;
                this.points[i][j].y = newy+this.y;
            }
        }
    };

    // Rotate around the y-axis
    rotateXZ(ang) {
        //console.log("XZ test: ",ang);
        for (var i in this.points) {
            for (var j in this.points[i]) {
                var px = this.points[i][j].x - this.x,
                    pz = this.points[i][j].z - this.z;

                var newx = px*Math.cos(ang)-pz*Math.sin(ang),
                    newz = px*Math.sin(ang)+pz*Math.cos(ang);

                this.points[i][j].x = newx+this.x;
                this.points[i][j].z = newz+this.z;
            }
        }
    };

    // Rotate around the x-axis
    rotateYZ(ang) {
        //console.log("YZ test: ",ang);

        for (var i in this.points) {
            for (var j in this.points[i]) {
                //console.log("old y: ", this.points[i][j].y,"\nold z: ", this.points[i][j].z);
                var py = this.points[i][j].y - this.y,
                    pz = this.points[i][j].z - this.z;

                var newy = py*Math.cos(ang)-pz*Math.sin(ang),
                    newz = py*Math.sin(ang)+pz*Math.cos(ang);

                this.points[i][j].y = newy+this.y;
                this.points[i][j].z = newz+this.z;
                //console.log("new y: ", this.points[i][j].y,"\nnew z: ", this.points[i][j].z);
            }
        }
    };
}


/****************
 * Main code    *
 ****************/
function main() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const sphere = new Sphere({
        ctx,
        x: canvas.width/2,
        y: canvas.height/2,
        z: 0,
        r: 275,
        drawSpheres: true
    });
    sphere.draw();

    // Drag events
    let dragOrigin;
    canvas.addEventListener('mousedown', dragStartHandler)
    function dragStartHandler(e){
        dragOrigin = {
            x: e.clientX,
            y: e.clientY
        };
        document.addEventListener('mousemove', dragHandler);

        window.addEventListener('mouseup', dragStopHandler);
        window.addEventListener('mouseout', dragStopHandler);

        canvas.addEventListener('mouseout', stopPropagation);
        document.body.addEventListener('mouseout', stopPropagation);
    }

    function dragHandler(e){
        if (e.ctrlKey || e.metaKey) {
            if (e.altKey) sphere.hiddenFun2(e.clientX-dragOrigin.x, e.clientY-dragOrigin.y);
            else sphere.zoom(e.clientX-dragOrigin.x, e.clientY-dragOrigin.y, -1);
        }
        else if (e.shiftKey) {
            if (e.altKey) sphere.hiddenFun1(e.clientX-dragOrigin.x, e.clientY-dragOrigin.y);
            else sphere.pan(e.clientX-dragOrigin.x, e.clientY-dragOrigin.y);
        }
        else {
            sphere.rotate(e.clientX-dragOrigin.x, e.clientY-dragOrigin.y);
        }
        dragOrigin.x = e.clientX;
        dragOrigin.y = e.clientY;
    }

    function dragStopHandler(e) {
        document.removeEventListener('mousemove', dragHandler);
        document.removeEventListener('mouseup', dragStopHandler);
        document.removeEventListener('mouseout', dragStopHandler);

        canvas.removeEventListener('mouseout', stopPropagation);
        document.body.removeEventListener('mouseout', stopPropagation);
    }

    function stopPropagation(e) {
        e.stopPropagation();
    }
}
main();
