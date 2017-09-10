if (window.console == undefined) {
	window['console'] = {};
	window['console'].log = function(s) {};
	window['console'].error = function(s) {};
}

var PlumeGraph = function(data, partTypes) {

	var Easer = function(arr, val) {
		var val = val || 0;
		var target = val || 0;
		this.easing = 0.6;
		this.round = true;
		this.thresh = 1;
		this.e = function(v) {
			this.easing = v || this.easing;
			return this;
		}
		this.__defineGetter__("val", function() {
			return this.round ? Math.round(val) : val;
		});
		this.forceVal = function(v) {
			val = v;
		};
		this.__defineSetter__("val", function(targetVal) {
			target = targetVal;
			if (Math.abs(target-val) < this.thresh) {
				val = target;
			} else {
				val += (targetVal - val)*this.easing;
			}
		});
		this.__defineGetter__("settled", function() {
			return val == target;
		});
		arr.push(this);
	}

	var EaserArray = function(arr, size, e) {
		var r = [];
		while (r.length < size) {
			r.push(new Easer(arr).e(e));
		}
		return r;
	}

	var points = [];
	var barCanvasHeight = 600;
	var BarCanvas = function() {
		this.domElement = document.createElement('canvas');
		var g = this.domElement.getContext('2d');
		var biggestEver = null;
		var easers = [];
		var lockTypes = false;
		var lockStatus = false;
		var _bar = this;
		var numLayers = 9;
		var ee = 1;
		var totalE = new Easer(easers).e(ee);
		var eachLayersE = EaserArray(easers, numLayers, ee);
		var totalsByTypeE = {};
		var forceUpdate = false;
		this.needsUpdating = function() {
			if (forceUpdate) {
				forceUpdate = false;
				return true;
			}
			for (var i = 0; i < easers.length; i++) {
				if (!easers[i].settled) {
					return true;
				}
			}
			return false;
		};

		var unfocus = function() {
			stickied = false;
			_this.supressionFunction = null;
			forceUpdate = true;
			allSolid();
			lockTypes = false;
			lockStatus = false;
		}

		var allSolid = function() {
			var lis = document.getElementsByTagName('li');
			for (var i = 0; i < lis.length; i++) {
					lis[i].style.opacity = '1';
					lis[i].setAttribute('class', '');
			}
		}

		var stickied = false;
		var enableHighlightByCode = function(code) {
			var li = document.getElementById(code);
			li.addEventListener('mouseover', function() {
				if (stickied) return;
				_this.supressionFunction = function(particle) {
					return particle.code != code;
				};
				var lis = document.getElementsByTagName('li');
				for (var i = 0; i < lis.length; i++) {
					if (this != lis[i] && lis[i].getAttribute('id') != 'total') {
						lis[i].style.opacity = '0.1';
					}
				}
				lockTypes = true;
				_bar.update();
			}, false);
			var sticky = function() {
				if (stickied) {
					unfocus();
					li.removeEventListener('mousedown', unfocus, false);
				} else {
					li.setAttribute('class', 'sticky');
					stickied = true;
					_this.supressionFunction = function(particle) {
						return particle.code != code;
					};
					li.addEventListener('mousedown', unfocus, false);
				}
			};
			li.addEventListener('mousedown', sticky, false);
			li.addEventListener('mouseout', function() { if (stickied) return; unfocus()}, false);
		}

		for (var i in partTypes) {
			enableHighlightByCode(i);
			var li = document.getElementById(i);
			var swatch = li.getElementsByClassName('swatch')[0];
			swatch.style.backgroundColor = '#'+partTypes[i].color.toString(16);
			totalsByTypeE[i] = new Easer(easers).e(ee);
		}

		this.firstDraw = true;
		this.update = function() {
			g.save();
			g.translate(0, barCanvasHeight);
			g.scale(1, -1);
			g.clearRect(0, 40, window.innerWidth, barCanvasHeight);
			var layerPoints = [];
			var totalsByType = {};
			for (var i in partTypes) {
				totalsByType[i] = 0;
			}
			for (var i = 0; i < numLayers; i++) {
				layerPoints[i] = 0;
			}
			var layerPointsTotal = 0;
			for (var i = 0; i < points.length; i++) {
				if (points[i].surpressed) {
					continue;
				}
				var c = points[i].code;
				totalsByType[c]++;
			}
			for (var i = 0; i < numLayers; i++) {
				for (var p in pillars) {
					for (var j = 0; j < pillars[p].bundles[i].points.length; j++) {
						var point = pillars[p].bundles[i].points[j];
						if (point.surpressed) {
							continue;
						}
						layerPoints[i]++;
						layerPointsTotal++;
					}
				}
			}
			for (var i = 0; i < layerPoints.length; i++) {
				eachLayersE[i].val = layerPoints[i];
			}
			for (var i in partTypes) {
				var li = document.getElementById(i);
				if (!lockTypes) totalsByTypeE[i].val = totalsByType[i];
				li.getElementsByClassName('total')[0].innerHTML = totalsByTypeE[i].val;
			}
			li = document.getElementById('total');
			if (!lockStatus) totalE.val = layerPointsTotal;
			li.getElementsByClassName('total')[0].innerHTML = totalE.val;
			if (biggestEver == null) {
				biggestEver = 0;
				for (var i = 0; i < numLayers; i++) {
					var amt = layerPoints[i];
					if (amt > biggestEver) {
						biggestEver = amt;
					}
				}
			}

			var barWidth = 18;
			barSpacing = 26;

			g.save();
			g.translate(33, 45);

			var layers = ['Layer1', 'Layer2', 'Layer3', 'Layer4', 'Layer5', 'Layer6', 'Layer7', 'Layer8', 'Layer9'];
			if (_bar.firstDraw) {
				g.save();
				g.scale(1, -1);
				g.clearRect(0, 0, window.innerWidth, 40);
				g.textAlign='center';
				g.font = "12px 'Lucida Grande', sans-serif";
				g.fillText('Layer', (barWidth+barSpacing)*4.5, 25);
				g.restore();
			}
			for (var i = 0; i < numLayers; i++) {
				g.font = "12px 'Lucida Grande', sans-serif";
				g.fillStyle = "#000";

				var x = i*(barWidth+barSpacing);

				var barHeight = eachLayersE[i].val/biggestEver*(barCanvasHeight-60);
				g.fillRect(x, 0, barWidth, 0);
				g.textAlign = 'center';
				if (_bar.firstDraw) {
					g.save();
					g.scale(1, -1);
					g.translate(0, 11);
					g.fillText(layers[i%layers.length], x+barWidth/2+1, 0);
					g.restore();
				}
				g.font = "12px 'Lucida Grande', sans-serif";
				g.save();
				g.translate(x+8, 0);
				g.scale(1, -1);
				g.fillText(eachLayersE[i].val, 0, -barHeight-4);
				g.restore();
				g.fillStyle = 'rgba(0, 0, 0, 0.2)';
				g.fillRect(x, 0, barWidth, barHeight);
			}
			g.restore();
			g.restore();
			_bar.firstDraw = false;
		}
	}

	var barCanvas = new BarCanvas();
	barCanvas.domElement.height = barCanvasHeight;
	barCanvas.domElement.style.position = 'absolute';
	barCanvas.domElement.style.zIndex = '400';
	barCanvas.domElement.style.right = '0';
	barCanvas.domElement.style.bottom = '0';

	var renderer = new THREE.WebGLRenderer();
	var camera = new THREE.Camera( 70, window.innerWidth / window.innerHeight, 1, 20000 );
	camera.position.y = 500;
	var onResize = function() {
		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		barCanvas.domElement.width = 415;
		barCanvas.update();
		barCanvas.firstDraw = true;
	}
	var scene = new THREE.Scene();
	var geometry = new THREE.Geometry();

	var sprite = ImageUtils.loadTexture( "circle.png" );
	var billboard = function(sprite, x, y, z, bsize, bsizeAt) {
		var geo = new THREE.Geometry();
		geo.vertices.push(new THREE.Vertex( new THREE.Vector3( x, y, z ) ) );
		var labelMaterial = new THREE.ParticleBasicMaterial( { color: 0x000000, sizeAttenuation: bsizeAt, size: bsize,  map: sprite, vertexColors: true } );
		var sys = new THREE.ParticleSystem( geo, labelMaterial );
		sys.sortParticles = true;
		sys.updateMatrix();
		scene.addObject( sys );
	}

	var labelSprites = [];
	for (var i = 1; i <= 23; i++) {
		if (i == 2) continue;
		var j = i < 10 ? '0'+i : i+'';
		var path = "labels/labels_"+j+".png";
		labelSprites.push(ImageUtils.loadTexture(path));
	}

	window.addEventListener('resize', onResize, false);

	document.body.appendChild( barCanvas.domElement );
	document.body.appendChild( renderer.domElement );

	var supressionFunction = null;
	this.__defineGetter__('supressionFunction', function() {
		return supressionFunction;
	});
	this.__defineSetter__('supressionFunction', function(v) {
		supressionFunction = v;
		for (var i = 0; i < points.length; i++ ){
			points[i].forceUpdate = true;
		}
	});

	var _this = this;
	var colors = [];
	var Point = function(json, x, y, bundleZ) {
		this.size = json.size;
		this.forceUpdate = true;
		this.type = partTypes[json.type];
		this.code = json.type;
		this.x = json.x*2.7 + x;
		this.y = bundleZ;
		this.z = json.y*2.7 + y;
		this.easerY = new Easer(easers, this.y);
		this.easerY.easing = 0.25 + Math.random()*0.2;
		this.easerY.thresh = 1;
		var vector = new THREE.Vector3(this.x, this.y , this.z);

		this.__defineGetter__('surpressed', function() {
			return _this.supressionFunction != null && _this.supressionFunction.call(this, this);
		});

		this.i = geometry.vertices.length;
		geometry.vertices.push( new THREE.Vertex( vector ) );
		colors.push(new THREE.Color( partTypes[json.type].color ));
		var pos = geometry.vertices[this.i].position;
		var hideHeight = Math.random()*1000 + 2000;
		points.push(this);
		this.update = function() {
			if (!this.forceUpdate && this.easerY.settled) {
				return;
			}
			this.easerY.val = this.y + (this.surpressed ? hideHeight : 0);
			pos.y = this.easerY.val;
			this.forceUpdate = false;
		}
	}

	var Bundle = function(layer, x, y, z) {
		this.points = [];
		for (var i = 0; i < layer.length; i++) {
			this.points.push(new Point(layer[i], x, y, z));
		}
	}

	var layerSpacing = 120;
	var Pillar = function(spriteIndex, json, x, y) {
		this.bundles = [];
		this.x = x;
		this.y = y;
		for (var l = 0; l < json.length; l++) {
			var bundle = new Bundle(json[l].layer, x, y, layerSpacing*l);
			this.bundles.push(bundle);
		}
		lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.088, linewidth: 1 } );
		this.line = addLine(x, layerSpacing*-0.5, y, x, layerSpacing*(9-0.5), y);
		billboard(labelSprites[spriteIndex], x, layerSpacing*-0.5, y, 96, true);
		billboard(labelSprites[spriteIndex], x, layerSpacing*(9-0.5), y, 96, true);
	}

	var lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.088, linewidth: 1 } );
	var addLine = function(x1, y1, z1, x2, y2, z2) {
		var gg =  new THREE.Geometry();
		gg.vertices.push( new THREE.Vertex( new THREE.Vector3( x1, y1, z1 ) ) );
		gg.vertices.push( new THREE.Vertex( new THREE.Vector3( x2, y2, z2 ) ) );
		var line = new THREE.Line( gg, lineMaterial, THREE.LinePieces );
		line.material = lineMaterial;
		line.updateMatrix();
		scene.addObject( line );
		return line;
	}

	var easers = [];
	var angle = new Easer(easers, Math.PI);
	angle.thresh = 0.01;
	angle.round = false;
	angle.easing = 0.15;
 	var tcircleDist = 1400;
	var circleDist = new Easer(easers, tcircleDist);
	circleDist.round = false;
	circleDist.easing = 0.05;
	var tangle = -0.25
	var teyeHeight = 750;
	var eyeHeight = new Easer(easers, teyeHeight);
	eyeHeight.round = false;
	var eyeDrop = 350;
	this.draw = function(ctx) {
		angle.val = tangle;
		circleDist.val = tcircleDist;
		camera.position.x = Math.cos(angle.val)*circleDist.val;
		camera.position.z = Math.sin(angle.val)*circleDist.val;
		eyeHeight.val = teyeHeight;
		camera.position.y = eyeHeight.val;
		camera.target.position.y = eyeHeight.val-eyeDrop;
		for (var i = 0; i < points.length; i++) {
			points[i].update();
		}
		geometry.__dirtyVertices = true;
		renderer.render( scene, camera );
		if (barCanvas.needsUpdating()) {
			barCanvas.update();
		}
	};

	var pp = [];
	var pillars = {};
	pp.push(pillars['PT01'] = new Pillar(10, data['PT01'],  500,   0 ));
	pp.push(pillars['PT02'] = new Pillar(11, data['PT02'],  433, 250 ));
	pp.push(pillars['PT03'] = new Pillar(12, data['PT03'],  250, 433 ));
	pp.push(pillars['PT04'] = new Pillar(13, data['PT04'],    0, 500 ));
	pp.push(pillars['PT05'] = new Pillar(14, data['PT05'], -250, 433 ));
	pp.push(pillars['PT06'] = new Pillar(15, data['PT06'], -433, 250 ));
	pp.push(pillars['PT07'] = new Pillar(16, data['PT07'], -500,   0 ));
	pp.push(pillars['PT08'] = new Pillar(17, data['PT08'], -433,-250 ));
	pp.push(pillars['PT09'] = new Pillar(18, data['PT09'], -250,-433 ));
	pp.push(pillars['PT10'] = new Pillar(19, data['PT10'],    0,-500 ));
	pp.push(pillars['PT11'] = new Pillar(20, data['PT11'],  250,-433 ));
	pp.push(pillars['PT12'] = new Pillar(21, data['PT12'],  433,-250 ));

	var layerIndices = [1, 2, 3, 4, 5, 6, 7, 8, 9];

	for (var l = 0; l < 9; l++) {
		billboard(labelSprites[layerIndices[l%layerIndices.length]], 0, l*layerSpacing, 0, 48, false);
		lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.088, linewidth: 1 } );
		for (var i = 0; i < pp.length-1; i++) {
			addLine(pp[i].x, l*layerSpacing, pp[i].y, pp[i+1].x, l*layerSpacing, pp[i+1].y);
			addLine(pp[i].x, l*layerSpacing, pp[i].y, 0, l*layerSpacing, 0);
		}
		addLine(pp[i].x, l*layerSpacing, pp[i].y, pp[0].x, l*layerSpacing, pp[0].y);
		addLine(pp[i].x, l*layerSpacing, pp[i].y, 0, l*layerSpacing, 0);
	}
	addLine(0, layerSpacing*-0.5, 0, 0, layerSpacing*(9-0.5), 0);
	onResize();

	geometry.colors = colors;
	var material = new THREE.ParticleBasicMaterial( { size: 20, sizeAttenuation:true, blending: THREE.BillboardBlending, map: sprite, vertexColors: true } );
	particles = new THREE.ParticleSystem( geometry, material );
	particles.sortParticles = true;
	particles.updateMatrix();
	scene.addObject( particles );

	var omap = ImageUtils.loadTexture("afghanistan.png");
	var materials = [];
	materials[2] = [ new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 1, shading: THREE.FlatShading, map: omap } ) ];
	var cube = new THREE.Mesh( new Cube( 2048, 0, 2048, 1, 1, 1, materials), new THREE.MeshFaceMaterial() );
	cube.position.y = -layerSpacing*0.55;
	cube.overdraw = true;
	scene.addObject( cube );

	var mouseDown = false;
	document.addEventListener( 'mousedown', function() {
		mouseDown = true;
		document.addEventListener('mousemove', onDocumentMouseMove, false);
	}, false );

	document.addEventListener( 'mouseup', function() {
		pmouseX = null;
		mouseDown = false;
		document.removeEventListener('mousemove', onDocumentMouseMove, false);
	}, false );

	var minDist = 40;
	var maxDist = 2000;
	var wheelFriction = 1.0;
	var wheel = function(e) {
		var steps = e.wheelDeltaY ? e.wheelDeltaY : -e.detail*13;
		if (disable) return;
		tcircleDist -= steps*wheelFriction;
		if (tcircleDist < minDist) {
			tcircleDist = minDist;
		} else if (tcircleDist > maxDist) {
			tcircleDist = maxDist;
		}
	}

    window.addEventListener('DOMMouseScroll', wheel, false);
	document.addEventListener( 'mousewheel', wheel, false );

	var pmouseX=null, pmouseY=null;
	var mouseX = 0, mouseY = 0;
	function onDocumentMouseMove( event ) {
		if (disable) return;
		mouseX = event.clientX;
		mouseY = event.clientY;
		if (pmouseX == null) {
			pmouseX = mouseX;
			pmouseY = mouseY;
		}
		tangle += ((mouseX - pmouseX)/(1.0*window.innerWidth) * Math.PI*2);
		teyeHeight -= (pmouseY - mouseY)/(1.0*window.innerHeight) * 1000;
		pmouseX = mouseX;
		pmouseY = mouseY;
	}
};
