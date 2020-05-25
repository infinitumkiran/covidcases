var data;
var a = ''
$(document).ready(function () {
    $.getJSON('https://api.thevirustracker.com/free-api?countryTotals=ALL', function (j) {
        data = j;
    }).then(function () {

        var rotationDelay = 3000;
        // scale of the globe (not the canvas element)
        var scaleFactor = 0.9;
        // autorotation speed
        var degPerSec = 6;
        // start angles
        var angles = {
            x: -20,
            y: 40,
            z: 0
        };
        // colors
        var colorWater = '#111';
        var colorLand = 'red';
        var colorGraticule = '#111';
        var colorCountry = '#a00';


        //
        // Handler
        //

        // var data = fetch('https://api.thevirustracker.com/free-api?countryTotals=ALL');


        //
        // Variables
        //

        var current = d3.select('#current');
        var canvas = d3.select('#globe');
        var context = canvas.node().getContext('2d');
        var water = {
            type: 'Sphere'
        }
        var projection = d3.geoOrthographic().precision(0.1);
        var graticule = d3.geoGraticule10();
        var path = d3.geoPath(projection).context(context);
        var v0; // Mouse position in Cartesian coordinates at start of drag gesture.
        var r0; // Projection rotation as Euler angles at start.
        var q0; // Projection rotation as versor at start.
        var lastTime = d3.now();
        var degPerMs = degPerSec / 1000;
        var width, height;
        var land, countries;
        var countryList;
        var autorotate, now, diff, roation;
        var currentCountry;

        //
        // Functions
        //

        function setAngles() {
            var rotation = projection.rotate();
            rotation[0] = angles.y;
            rotation[1] = angles.x;
            rotation[2] = angles.z;
            projection.rotate(rotation);
        }

        function scale() {
            width = document.documentElement.clientWidth;
            height = document.documentElement.clientHeight * 0.6;
            canvas.attr('width', width).attr('height', height);
            projection
                .scale((scaleFactor * Math.min(width, height)) / 2)
                .translate([width / 2, height / 2]);
            render();
        }

        function startRotation(delay) {
            autorotate.restart(rotate, delay || 0);
        }

        function stopRotation() {
            autorotate.stop();
        }

        function dragstarted() {
            v0 = versor.cartesian(projection.invert(d3.mouse(this)));
            r0 = projection.rotate();
            q0 = versor(r0);
            stopRotation();
        }

        function dragged() {
            var v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this)));
            var q1 = versor.multiply(q0, versor.delta(v0, v1));
            var r1 = versor.rotation(q1);
            projection.rotate(r1);
            render();
        }

        function dragended() {
            startRotation(rotationDelay);
        }

        function render() {
            context.clearRect(0, 0, width, height)
            fill(water, colorWater);
            stroke(graticule, colorGraticule);
            fill(land, colorLand);
            if (currentCountry) {
                fill(currentCountry, colorCountry);
            }
        }

        function fill(obj, color) {
            context.beginPath();
            path(obj);
            context.fillStyle = color;
            context.fill();
        }

        function stroke(obj, color) {
            context.beginPath();
            path(obj);
            context.strokeStyle = color;
            context.stroke();
        }

        function rotate(elapsed) {
            now = d3.now();
            diff = now - lastTime
            if (diff < elapsed) {
                rotation = projection.rotate();
                rotation[0] += diff * degPerMs;
                projection.rotate(rotation)
                render();
            }
            lastTime = now;
        }

        function loadData(cb) {
            d3.json('data.json', function (error, world) {
                if (error) throw error
                d3.tsv(
                    'country.tsv',
                    function (error, countries) {
                        if (error) throw error
                        cb(world, countries);
                    })
            });
        }

        // https://github.com/d3/d3-polygon
        function polygonContains(polygon, point) {
            var n = polygon.length;
            var p = polygon[n - 1];
            var x = point[0],
                y = point[1];
            var x0 = p[0],
                y0 = p[1];
            var x1, y1;
            var inside = false;
            for (var i = 0; i < n; ++i) {
                p = polygon[i], x1 = p[0], y1 = p[1]
                if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) inside = !inside;
                x0 = x1, y0 = y1;
            }
            return inside;
        }

        function mousemove() {
            var c = getCountry(this);
            if (!c) {
                if (currentCountry) {
                    $('#wrapper').empty();
                    leave(currentCountry);
                    render();
                }
                return;
            }

            if (c === currentCountry) {
                return;
            }
            currentCountry = c;
            render();
            enter(c);
        }

        function getCountry(event) {
            var pos = projection.invert(d3.mouse(event))
            return countries.features.find(function (f) {
                return f.geometry.coordinates.find(function (c1) {
                    return polygonContains(c1, pos) || c1.find(function (c2) {
                        return polygonContains(c2, pos);
                    })
                })
            })
        }


        //
        // Initialization
        //

        setAngles();

        canvas
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended)
            )
            .on('mousemove', mousemove);

        loadData(function (world, cList) {
            land = topojson.feature(world, world.objects.land);
            countries = topojson.feature(world, world.objects.countries);
            countryList = cList;

            window.addEventListener('resize', scale);
            scale();
            autorotate = d3.timer(rotate);
        });

        function enter(country) {
            $("#wrapper").empty();

            var country = countryList.find(function (c) {
                return parseInt(c.id, 10) === parseInt(country.id, 10)
            });

            // current.text(country && country.name || '');
            a = country.name;
            for (var i in data["countryitems"][0]) {
                var b = data["countryitems"][0][i].title;
                // console.log(data["countryitems"][0][i].title);
                if (b == a) {
                    console.log(data["countryitems"][0][i].title);
                    console.log(country.name);
                    var cardtemplate = '<div data-backdrop="false" class="fade modal" style="position:relative;right:0;bottom:0;z-index:2;" id="MyModal-sm"><div class="modal-dialog"><div class="modal-content" style="background-color:black;"><div class="modal-body"style="background-color:black;"><div class="row"><div class="card bg-red"><h1 class="card-title" style="text-align:center;margin-bottom:0px;">'+country.name +'</h1><hr class="rounded"><p>Total Cases : ' + data["countryitems"][0][i].total_cases + '</p><p>Recovered : ' + data["countryitems"][0][i].total_recovered + '</p><p>Total Deaths : ' + data["countryitems"][0][i].total_deaths + '</p><p>New Cases : ' + data["countryitems"][0][i].total_new_cases_today + '</p><p>New Deaths : ' + data["countryitems"][0][i].total_new_deaths_today + '</p><p>Active Cases : ' + data["countryitems"][0][i].total_active_cases + '</p></div></div></div></div></div></div>';

                    cardtemplate += '<script>$("Document").ready(function(){$(".modal-sm").modal();$("#MyModal-sm").modal("show");});</script>';
                    $("#wrapper").append(cardtemplate);
                    delete(cardtemplate);

                }
            }
        }

        function leave(country) {
            country = '';
            delete(cardtemplate);
        }
    });
});



let Dust = function (canvas, wrapper) {
    this.canvasSelector = canvas;
    this.blur = blur

    this.canvas = null;
    this.context = null;
    this.maxSize = (window.devicePixelRatio > 1) ? 4 : 8;
    this.particleNumber = 300;
    this.xMomentum = 0;
    this.particleColors = [
        '#D21F3C',
        '#BF0A30',
        '#B80F0A',
        '#8D021F'
    ]

    this.targetWidth = window.innerWidth;
    this.targetHeight = window.innerHeight;

    this.particles = [];

    this.random = function (mult) {
        return Math.ceil(Math.random() * mult);
    }

    this.makeParticle = function (startx = null, starty = null) {
        let self = this;

        let particle = {
            x: startx ? startx : self.random(self.targetWidth),
            y: starty ? starty : self.random(self.targetHeight),
            xv: Math.random() * .5 - .25,
            yv: Math.random() * .25,
            color: self.particleColors[Math.floor(Math.random() * self.particleColors.length)],
            mass: null,
            sides: self.random(5),
            sideArray: [],


            makeShape: function () {
                for (let j = 0; j < this.sides; j++) {
                    let side = {
                        x: self.random(self.maxSize),
                        y: self.random(self.maxSize)
                    }
                    this.sideArray.push(side)
                }

                this.mass = (this.sideArray.length / self.maxSize)
                this.yv = this.yv * this.mass
            },

            draw: function () {
                self.ctx.moveTo(this.x, this.y);
                self.ctx.beginPath();

                for (let i = 0; i < this.sideArray.length; i++) {
                    let side = this.sideArray[i];
                    self.ctx.lineTo(side.x + this.x, side.y + this.y)
                }

                self.ctx.closePath();
                self.ctx.fill();
            },
        }

        particle.makeShape();

        this.particles.push(particle);
    }


    this.animate = function () {
        let self = this;
        // this is to determine if the page is scrolled to calculate the location of particles
        let scrollPos = document.querySelector(wrapper).scrollTop

        // setting mouse momentum, but giving it a maximum value so you can't accelerate a particle to over 9000
        self.xMomentum = ((this.mouseX - this.mousePrevX) * (1 / 15));
        self.yMomentum = ((this.mouseY - this.mousePrevY) * (1 / 15));

        self.mousePrevX = self.mouseX;
        self.mousePrevY = self.mouseY;

        self.ctx.clearRect(0, 0, self.targetWidth, self.targetHeight);

        for (let i = 0; i < self.particles.length; i++) {
            let particle = self.particles[i]

            // setting momentum on particles within 50px of cursor
            if ((particle.y > (self.mouseY + scrollPos - 25) && particle.y < (self.mouseY + scrollPos + 25)) && (particle.x > self.mouseX && particle.x <= self.mouseX + 5)) {
                particle.xv = particle.xv + ((isNaN(this.xMomentum) ? 0 : self.xMomentum) * particle.mass)
                particle.yv = particle.yv + ((isNaN(this.yMomentum) ? 0 : self.yMomentum) * particle.mass)
            }

            // takes particle's mass into account determining its velocity
            particle.x = particle.x + (particle.xv * particle.mass);
            particle.y = particle.y + (particle.yv * particle.mass);

            // if a particle is moving fast to the left or right, slow it down
            // combined with the above, this gives a good impression of gravity pulling the particle's lateral momentum downward
            if (particle.xv > 1) {
                particle.xv -= 0.25;
            } else if (particle.xv < -1) {
                particle.xv += 0.25
            }

            // "heavier" objects fall faster
            if (particle.yv < .25) {
                particle.yv += (0.01 * particle.mass);
            }


            self.ctx.fillStyle = particle.color;

            // if the particle is out of the height or width of the document, delete it and spawn a new one just out of screen
            if (particle.x > self.targetWidth || particle.x < -100 || particle.y > self.targetHeight || particle.y < -100) {
                let index = self.particles.indexOf(particle)
                let startX = Math.floor(Math.random() * window.innerWidth) - 100;
                let startY = Math.floor(Math.random() * -100);
                self.particles.splice(index, 1)
                self.makeParticle(startX, startY);
            }
            particle.draw()
        }

        window.requestAnimationFrame(self.animate);
    }.bind(this);

    this.init = function () {
        this.canvas = document.querySelector(this.canvasSelector);
        this.canvas.width = this.targetWidth;
        this.canvas.height = this.targetHeight;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineWidth = 1;


        for (let i = 0; i < this.particleNumber; i++) {
            this.makeParticle();
        }

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

        })

        window.requestAnimationFrame(this.animate);
    }

    this.init();
}

let dustDemo = new Dust('#canvas', '.dust-wrap');
let dustDemoTwo = new Dust('#canvas-two', '.dust-wrap');





var world;
$(document).ready(function () {
    $.getJSON('https://coronavirus-19-api.herokuapp.com/countries/World', function (x) {
        world = x;
    }).then(function () {
        console.log(world.cases);
        var footertemplate='<div id="footer" style="display:block"><p><span class="tiny">TOTAL COUNTS (as of <span class="timestamp">a minute ago</span>)</span><br>ACTIVE:&nbsp;<span id="total-cases" style="color:orange;">'+world.active+'</span><span id="total-count" class="tiny">/'+world.cases+'</span><span class="muted disappear">&nbsp;</span> &nbsp;DEATHS:&nbsp;<span id="total-deaths" style="color:red;">'+world.deaths+'</span> <span class="tooltip"><span class="muted disappear">&nbsp;</span> RECOVERIES:&nbsp;<span id="total-recovered">'+world.recovered+'</span></span></span> &nbsp;RECOVERIES:&nbsp;<span id="total-recovered" style="color:lightgreen;">'+world.recovered+'</span></span></p><button id="more-info-button" data-micromodal-trigger="more-info">Creators</button></div>';
        $('#bottom').append(footertemplate);
        delete(footertemplate);
    });
});