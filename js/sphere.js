/**
 * Class Dot
 * =========
 * 
 * Members:
 * --------
 * 
 * x, y, z:     The cartesian coordinates of the dot in the space of the sphere.
 * fg:          A flag indicating whether the dot is in the foreground.
 * fgcolor:     The color to use if fg == true.
 * bgcolor:     The color to use if fg == false.
 * 
 * 
 * About:
 * ------
 * 
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
 */
function Dot(x,y,z,fg,fgColor,bgColor) {
    // Default Values:  { x: 0, y: 0, z: 0, fg: true, fgcolor: #7EE37E, bgcolor: "#787878" }
    this.x = typeof x !== 'undefined' ? x : 0;
    this.y = typeof y !== 'undefined' ? y : 0;
    this.z = typeof z !== 'undefined' ? z : 0;
    this.fg = typeof fg !== 'undefined' ? fg : true;
    this.fgColor = typeof fgColor !== 'undefined' ? fgColor : "#7EE37E";
    this.bgColor = typeof bgColor !== 'undefined' ? bgColor : "#787878";
    
    this.Draw = function(ctx) {
        // Store the context's fillStyle
        var tmpStyle = ctx.fillStyle;
        // Set the fillStyle for the dot
        ctx.fillStyle = (this.fg ? this.fgColor : this.bgColor);
        // Draw the dot
        ctx.fillCircle(x,y,this.fg?10:5);
        // Restore the previous fillStyle
        ctx.fillStyle = tmpStyle;
    }
}


/**
 * Class Sphere
 * =========
 * 
 * Members:
 * --------
 * 
 * x, y, z:     Cartesian coordinates of the origin (center) point of the sphere.
 * r:           Radius of the sphere.
 * ctx:         Canvas context with which to draw.
 * drawSpheres: Flag indicating whether surface points (Dots) should be drawn as spheres or points.
 * circleSize:  Radius of the dots to be drawn.
 * points:      Array of surface points to keep track of.
 * 
 * 
 * About:
 * ------
 * 
 * The Spehre class represents the sphere object itself. (Go figure.)
 * It is basically comprised of a set of points on its surface and various
 * numbers to keep track of how it should be drawn next.
 * 
 * When drawn to the canvas, the dot list is dynamically sorted by Z-value 
 * and drawn back-to-front, so that the foremost dots are consistently drawn 
 * on top of those behind them. The further back a dot is (i.e. the lower its
 * z-value) the lighter it is colored. This way, those in back blend into the 
 * background, becoming almost invisible.
 * 
 */
function Sphere(x,y,z,r,ctx,drawSpheres) {
    // Default Values:  { x: 200, y: 200, z: 0, r: 90, ctx: null, drawSpheres: false }
    this.x = (typeof x !== 'undefined') ? x : 200;
    this.y = (typeof y !== 'undefined') ? y : 200;
    this.z = (typeof z !== 'undefined') ? z : 0;
    this.r = (typeof r !== 'undefined') ? r : 90;
    this.ctx = (typeof ctx !== 'undefined') ? ctx : null;
    this.drawSpheres = (typeof drawSpheres !== 'undefined') ? drawSpheres : false;
    
    // 10 pixel dots
    this.circleSize = 10;
    this.points = new Array();
    
    // The angle delta to use when calculating the surface point positions;
    // a larger angstep means fewer points on the surface
    var angstep = Math.PI/10;
    var i = 0;
    // Loop from 0 to 2*pi, creating one row of points at each step
    for (var angxy=0; angxy<2*Math.PI; angxy+=angstep){
        this.points[i] = new Array();
        var j=0;
        for (var angyz=0; angyz<2*Math.PI; angyz+=angstep) {
            // Loop from 0 to 2*pi, creating one point at each step
            var px  = r * Math.cos(angxy) * Math.sin(angyz) + x,
                py  = r * Math.sin(angxy) * Math.sin(angyz) + y,
                pz  = r * Math.cos(angyz) + z,
                pfg = pz > z;
            this.points[i][j] = new Dot(px,py,pz,pfg);
            j++;
        }
        i++;
    }

    // Draw to the canvas
    this.Draw = function() {
        // Store the context's fillStyle
        var tmpStyle = this.ctx.fillStyle;


        // Clear the canvas
        canvas.width -= 1;
        canvas.width += 1;
        
        // Set the canvas background color
        this.ctx.fillStyle = '#FFF';
        // Fill the canvas with the selected background color
        this.ctx.fillRect (0, 0, canvas.width, canvas.height);
        
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
                this.ctx.fillCircleGradient(z_sorted[p].x, z_sorted[p].y, this.circleSize, "#FFFFFF", color);
            } else {
                this.ctx.fillCircle(z_sorted[p].x, z_sorted[p].y, this.circleSize, color);
            }
        }
        
        // Restore the context's fillStyle
        this.ctx.fillStyle = tmpStyle;
    }
    
    // Zoom in or out (ctrl drag)
    this.Zoom = function(x,y) {
        var length = Math.round(Math.sqrt(x*x + y*y)),
            scale = (r + (x>0?length:-length))/r;
                    
                
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
        this.Draw();
    }
    
    // Split pan!  (Hidden function, alt+shift drag)
    this.HiddenFun1 = function(x,y) {
        this.r += Math.round(Math.sqrt(x*x + y*y));
        // Scale each point
        for (var i in this.points) {
            for (var j in this.points[i]) {
                this.points[i][j].x += (this.points[i][j].x > this.x ? x : -x);
                this.points[i][j].y += (this.points[i][j].y > this.y ? y : -y);
            }
        }
        // Redraw in new positions
        this.Draw();
    }
    
    // Cigar Zoom!  (Hidden function, alt+ctrl drag)
    this.HiddenFun2 = function(x,y) {
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
        this.Draw();
    }
        
    
    // Pan  (shift drag)
    this.Pan = function(x,y) {
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
        this.Draw();
    }
    
    // Rotate the sphere (drag with no modifier keys)
    this.Rotate = function(x,y) {
        // Vertical rotation
        this.rotateXZ(((Math.PI/2)/this.r)*x);
        // Horizontal rotation
        this.rotateYZ(((Math.PI/2)/this.r)*y);
        
        // Redraw in new positions
        this.Draw();
    }
    
    // Rotate around the z-axis
    this.rotateXY = function(ang) {
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
    this.rotateXZ = function(ang) {
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
    this.rotateYZ = function(ang) {
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


function ctxFillCircle(x,y,r,color) {
    var oldFS = this.fillStyle;
    this.fillStyle = color;
    this.beginPath();
    this.arc(x, y, r, 0, 2 * Math.PI, false);
    this.closePath();
    this.fill();
    this.fillStyle = oldFS;
}
function ctxStrokeCircle(x,y,r) {
    this.beginPath();
    this.arc(x, y, r, 0, 2 * Math.PI, false);
    this.closePath();
    this.stroke();
}
function ctxFillCircleGradient(x,y,r,color1,color2) {
    var oldFS = this.fillStyle;
    this.beginPath();
    this.arc(x, y, r, 0, 2 * Math.PI, false);
    this.closePath();
    // create radial gradient
    var grd = this.createRadialGradient(x-r/5, y-r/5, 0, x-r/5, y-r/5, r*0.8);
    // light blue
    grd.addColorStop(0, color1);
    // dark blue
    grd.addColorStop(1, color2);
    this.fillStyle = grd;
    this.fill();
    this.fillStyle = oldFS;
}

var sphere;

$(document).ready(function(){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    
    Object.getPrototypeOf(ctx).fillCircle = ctxFillCircle;
    Object.getPrototypeOf(ctx).strokeCircle = ctxStrokeCircle;
    Object.getPrototypeOf(ctx).fillCircleGradient = ctxFillCircleGradient;
    
    sphere = new Sphere(parseInt($("#canvas").css("width"))/2,parseInt($("#canvas").css("height"))/2,0,275,ctx,true);
    sphere.Draw();
    
    
    var startX, startY;
    $("#canvas")
    .drag("init", function(e){
        startX = e.clientX;
        startY = e.clientY;
    })
    .drag(function(e){
        if (e.ctrlKey) {
            if (e.altKey) sphere.HiddenFun2(e.clientX-startX,e.clientY-startY);
            else sphere.Zoom(e.clientX-startX, e.clientY-startY, -1);
        } else if (e.shiftKey) {
            if (e.altKey) sphere.HiddenFun1(e.clientX-startX,e.clientY-startY);
            else sphere.Pan(e.clientX-startX,e.clientY-startY);
        } else {        
            sphere.Rotate(e.clientX-startX,e.clientY-startY);
        }
        startX = e.clientX;
        startY = e.clientY;
    });
});


