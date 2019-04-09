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
    const oldFS = ctx.fillStyle;
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
    const oldFS = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.closePath();
    // create radial gradient
    const grd = ctx.createRadialGradient(x-r/5, y-r/5, 0, x-r/5, y-r/5, r*0.8);
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
 */
class Dot {
    constructor({x=0, y=0, z=0, fg=true}={}) {
        Object.assign(this, {x, y, z, fg});
    }

    /**
     * Scale this dot's position by multiplying all corrdinates by the given scale factor
     * @param {Number} scaleFactor
     */
    scale(scaleFactor) {
        this.x *= scaleFactor
        this.y *= scaleFactor
        this.z *= scaleFactor
    }

    /**
     * Move this dot to a new position indicated by the given x, y, and z distances
     * @param {Number} [x=0]
     * @param {Number} [y=0]
     * @param {Number} [z=0]
     */
    translate({x=0, y=0, z=0}) {
        this.x += x
        this.y += y
        this.z += z
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
            for (let angyz=0; angyz<2*Math.PI; angyz+=angstep) {
                // Loop from 0 to 2*pi, creating one point at each step
                this.points.push(new Dot({
                    x: r * Math.cos(angxy) * Math.sin(angyz) + x,
                    y: r * Math.sin(angxy) * Math.sin(angyz) + y,
                    z: r * Math.cos(angyz) + z,
                    fg: Math.cos(angyz) > 0
                }));
            }
        }
    }

    /**
     * Draw to the canvas
     */
    draw() {
        // Store the context's fillStyle
        const tmpStyle = this.ctx.fillStyle;


        // Clear the canvas
        this.canvas.width -= 1;
        this.canvas.width += 1;

        // Set the canvas background color
        this.ctx.fillStyle = '#FFF';
        // Fill the canvas with the selected background color
        this.ctx.fillRect (0, 0, this.canvas.width, this.canvas.height);

        // Sort the points by z-value

        // Clone the points array to avoid modifying it
        const z_sorted = this.points.slice();

        // Add the origin point of the sphere
        z_sorted.push(new Dot({x: this.x, y: this.y, z: this.z}));

        // Sort the points by z value
        z_sorted.sort(function(a,b){return (b.z-a.z)});


        for (const point of z_sorted) {
            let color;
            // If drawing the origin point, draw it blue
            if (point.x == this.x && point.y == this.y && point.z == this.z) {
                color = "#27F";
            }
            // Else, draw the point a shade of gray relative to the z-value,
            // with darker pixels in the front and lighter pixels farther back
            else {
                const n = Math.round(((point.z + this.r)/(this.r*2)) * 250);
                color = "rgb(" + n + "," + n + "," + n + ")";
            }

            if (this.drawSpheres) {
                fillCircleGradient(this.ctx, point.x, point.y, this.circleSize, "#FFFFFF", color);
            }
            else {
                fillCircle(this.ctx, point.x, point.y, this.circleSize, color);
            }
        }

        // Restore the context's fillStyle
        this.ctx.fillStyle = tmpStyle;
    }

    /**
     * Zoom in or out (ctrl drag)
     */
    zoom(x, y) {
        const length = Math.round(Math.sqrt(x*x + y*y));
        const scaleFactor = (this.r + (x > 0 ? length : -length)) / this.r;

        // Scale the sphere
        this.x *= scaleFactor;
        this.y *= scaleFactor;
        this.z *= scaleFactor;
        this.r *= scaleFactor;
        this.circleSize *= scaleFactor;

        // Scale each point
        for (const point of this.points) {
            point.scale(scaleFactor);
        }
        // Redraw in new positions
        this.draw();
    }

    /**
     * Pan (shift drag)
     */
    pan(x, y) {
        // Translate the sphere's origin
        this.x += x;
        this.y += y;

        // Translate each point
        for (const point of this.points) {
            point.translate({x, y})
        }

        // Redraw in new positions
        this.draw();
    }

    /**
     * Rotate the sphere (drag with no modifier keys)
     */
    rotate(x, y) {
        // Vertical rotation
        this.rotateXZ(((Math.PI/2)/this.r)*x);
        // Horizontal rotation
        this.rotateYZ(((Math.PI/2)/this.r)*y);

        // Redraw in new positions
        this.draw();
    }

    /**
     * Rotate around the z-axis
     */
    rotateXY(ang) {
        for (const point of this.points) {
            const px = point.x - this.x;
            const py = point.y - this.y;

            const newx = px*Math.cos(ang)-py*Math.sin(ang);
            const newy = px*Math.sin(ang)+py*Math.cos(ang);

            point.x = newx+this.x;
            point.y = newy+this.y;
        }
    }

    /**
     * Rotate around the y-axis
     */
    rotateXZ(ang) {
        for (const point of this.points) {
            const px = point.x - this.x;
            const pz = point.z - this.z;

            const newx = px*Math.cos(ang)-pz*Math.sin(ang);
            const newz = px*Math.sin(ang)+pz*Math.cos(ang);

            point.x = newx+this.x;
            point.z = newz+this.z;
        }
    }

    /**
     * Rotate around the x-axis
     */
    rotateYZ(ang) {
        for (const point of this.points) {
            const py = point.y - this.y;
            const pz = point.z - this.z;

            const newy = py*Math.cos(ang)-pz*Math.sin(ang);
            const newz = py*Math.sin(ang)+pz*Math.cos(ang);

            point.y = newy+this.y;
            point.z = newz+this.z;
        }
    }

    /**
     * Split pan!  (Hidden function, alt+shift drag)
     */
    hiddenFun1(x, y) {
        // Extend the radius of the sphere
        this.r += Math.round(Math.sqrt(x*x + y*y));

        // Translate each point
        for (const point of this.points) {
            point.translate({
                x: point.x > this.x ? x : -x,
                y: point.y > this.y ? y : -y
            })
        }

        // Redraw in new positions
        this.draw();
    }

    /**
     * Cigar Zoom!  (Hidden function, alt+ctrl drag)
     */
    hiddenFun2(x, y) {
        const length = Math.round(Math.sqrt(x*x + y*y));
        const scaleFactor = (this.r + (x>0?length:-length))/this.r;

        // Scale the sphere
        this.r += length;
        this.x *= scaleFactor;
        this.y *= scaleFactor;

        // Scale each point
        for (const point of this.points) {
            point.scale(scaleFactor);
        }

        // Redraw in new positions
        this.draw();
    }

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
