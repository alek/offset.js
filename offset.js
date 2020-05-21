/*!
 * Offset.js: Simple SVG Layout Library
 * (c) 2020 Aleksandar Bradic
 *
 * Released under the MIT License.
 */

(function(global) {

    if(!global) {
        throw "Global Window object is not available.";
    }

    // Block Diagram rendering

    var BlockDiagram = function(el, params) {
        return new BlockDiagram.init(el, params);
    }

    BlockDiagram.init = function(el, params) {
        var self = this;
        self.container = document.getElementById(el);
        self.anchor = {x: params.x, y: params.y};
        self.width = params.width;
        self.height = params.height;
        self.blockMap = {};
        self.objectIDs = [];
    }
    
    BlockDiagram.prototype = {

    	// -- internal functions --- 
		
		addSVG: function(tag, attrs) {	
			var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
			for (var k in attrs) {
				el.setAttribute(k, attrs[k]);
			}
			return el;
		},
		addHTML: function(tag, text, attrs) {
			var el = document.createElementNS('http://www.w3.org/1999/xhtml', tag);
			for (var k in attrs) {
				el.setAttribute(k, attrs[k]);
			}
			el.textContent = text;
			return el;
		},
        getCoord: function(params) {
        	if (this.grid) {
				if ((params.x != null) && (params.y != null)) {
			        return {x: params.x*(this.grid.cellWidth + this.grid.rowGutter),
			        		y: params.y*(this.grid.cellHeight + this.grid.columnGutter)
		    	    	}
				} else {
					throw "Grid coordinates missing."
				}
    	    } else {
		        return {x: this.width*Math.random(),
		        		y: this.height*Math.random()
	    	    }
	    	}
        },
        getMeasure: function(val, type) {
        	if (!this.grid) {
        		return val;
        	} else {
        		if (type === 'width') {
        			return val*(this.grid.cellWidth + this.grid.rowGutter)
        		} else if (type === 'height') {
        			return val*(this.grid.cellHeight + this.grid.columnGutter)
        		} else {
        			throw "Uknown type"
        		}
        	}
        },
        getFontSize: function(params) {
        	return this.fontSize ? this.fontSize : params;
        },
        getSVGFontStyle: function(params) {
			var config = {
				"font-size": params.fontSize ? params.fontSize : (this.fontSize ? this.fontSize : 10),
				"text-align": "middle",
				"alignment-baseline": "middle",
				"text-anchor": "middle",
				"opacity": "1.0",
				"font-family": "Helvetica;sans-serif",
				"font-weight": 300,
				"letter-spacing": "0px"
			}
			return Object.keys(config).map(function(key) { return key + ":" + config[key]}).join(";");
        },
        getHTMLFontStyle: function(params, width, height) {
			var config = {
				"font-size": params.fontSize ? params.fontSize : (this.fontSize ? this.fontSize : 10),
				"font-family": "Helvetica;sans-serif",
				"display": "flex",
				"align-items": "center",
				"justify-content": "center",
				"text-align": "center",
				"width": width + "px",
				"height": height + "px",				
				"font-weight": 300,
				"letter-spacing": "0px"
			}
			return Object.keys(config).map(function(key) { return key + ":" + config[key]}).join(";");
        },
        objectHash: function(s) {
        	if (s == null) { return "" }
			var h = 0, l = s.length, i = 0;
			if ( l > 0 )
				while (i < l) {
					h = (h << 5) - h + s.charCodeAt(i++) | 0;
				}
			return h;
        },
        getObjectID: function(type, title) {
        	if (!Array.isArray(title)) {
	        	return type + ";" + this.objectHash(title);
	        } else {
	        	var key = []
	        	for (var i=0; i<title.length; i++) {
	        		key.push(this.objectHash(title[i]))
	        	}
	        	return type + ";" + key.join(";")
	        }
        },
        getJSONHash: function(el) {
        	return this.objectHash(JSON.stringify(el));
        },
        getWireTitle: function(entries) {
        	return entries.sort().join(";");
        },
        findObjects: function(params) {
        	var results = []        
        	if (params.start && params.end) {
        		results.push(document.getElementById(this.getObjectID("path", [params.start,params.end])))
			} else {
				results.push(document.getElementById(this.getObjectID("text", params.title)));
        		results.push(document.getElementById(this.getObjectID("block", params.title)));
			}
			return results;
        },
        getGridMatrix: function(width, height) {
        	var result = [];
        	for (var i=0; i<width; i++) {
        		var array = []
        		for (var j=0; j<height; j++) {
        			array.push(false)
        		}
        		result.push(array)
        	}
        	return result;
        },
        isOccupied: function(coord) {   // absolute coordinate addressing
        	if (this.grid) {
        		var delta = [[1,0],[-1,0], [0,1], [0,-1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
        		for (var i=0; i<delta.length; i++) {
                    var xPos = coord.x+delta[i][0]
                    var yPos = coord.y+delta[i][1]
                    if (this.isWithinBounds({x: xPos, y: yPos})) {
	        		     var gridX = Math.floor(xPos/(this.grid.cellWidth+this.grid.columnGutter));
	        		     var gridY = Math.floor(yPos/(this.grid.cellHeight+this.grid.rowGutter));
	        		     if (this.grid.matrix[gridX][gridY]) {
	        			    return true;
    	        		 }
                    }
        		}
        		return false;
        	} else {
        		// todo: support grid-free inference
        		return false;
        	}
        },
        isWithinBounds: function(coord) {
        	return (coord.x > 0) && (coord.y > 0) && (coord.x < this.width) && (coord.y < this.height)        	
        },
        getFreeNeighbors: function(coord) {
            // shoot far & backtrack
        	var candidates = [
        		{x: coord.x + this.grid.cellWidth/2, y: coord.y},
        		{x: coord.x - this.grid.cellWidth/2, y: coord.y},
        		{x: coord.x, y: coord.y + this.grid.cellHeight/2},
        		{x: coord.x, y: coord.y - this.grid.cellHeight/2},
        	]
        	var result = []
        	for (var i=0; i<candidates.length; i++) {
        		if (!this.isOccupied(candidates[i]) && this.isWithinBounds(candidates[i])) {
        			result.push(candidates[i]);
        		} 
        	}
        	return result;
        },
        getDistance: function(node1, node2) {
            return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y)
        },
        distanceSort: function(target) {
        	return function(a, b) {
        		var d1 = Math.sqrt(Math.pow(a.x - target.x,2) + Math.pow(a.y - target.y,2));
        		var d2 = Math.sqrt(Math.pow(b.x - target.x,2) + Math.pow(b.y - target.y,2));
        		return d2 - d1
        	}
        },
        mazeRouter: function(startNode, endNode) {
			var queue = [startNode]
			var path = []
			var visited = {}

			while(queue.length > 0) {
				var el = queue.pop();
				path.push(el);
				var distance = this.getDistance(el, endNode);
				if (distance < this.grid.cellWidth/2) {
					path.push(endNode);
					break;
				}
				var neigh = this.getFreeNeighbors(el);
				neigh = neigh.sort(this.distanceSort(endNode));
				for (var i=0; i<neigh.length; i++) {
					if (!visited[this.getJSONHash(neigh[i])]) {
						visited[this.getJSONHash(el)] = true;
						queue.push(neigh[i]);
					}
				}
				if (path.length > 100) {
					break;
				}
			}
			return path.map(function(el) { return [el.x, el.y] });
        },
        getRoute: function(startPads, endPads) {
			var bestPath = null
			for (var i=0; i<startPads.length; i++) {
				for (var j=0; j<endPads.length; j++) {
					var path = this.mazeRouter(startPads[i], endPads[j]);
					if (bestPath == null || path.length < bestPath.length) {
						bestPath = path;
					}
				}
			}
			return bestPath;
        },

        // --- public functions --- 

        setGrid: function(config) {
        	this.grid = {
        		rows: config.rows,
        		columns: config.columns,
        		columnGutter: 0,
        		rowGutter: 0,
        		cellHeight: this.height/config.rows,
        		cellWidth: this.width/config.columns,
        		matrix: this.getGridMatrix(config.columns, config.rows)
        	}
            return this;
        },
        updateGridAllocation: function(params) {
        	if (this.grid) {
        		for (var x=params.x; x < params.x + params.width; x++) {
        			for (var y=params.y; y < params.y + params.height; y++) {
        				this.grid.matrix[x][y] = true;
        			}
        		}
        	}
        	return this;
        },
        setBackground: function(params) {
			this.rect({
				x: 0,
				y: 0,
				width: this.width,
				height: this.height,
				stroke: null,
				fill: params.color,
				style: "stroke-width:0;"
			});	
        	return this;
        },
        setLayout: function(layoutType) {
        	this.layout = layoutType;
        	return this;
        },
        setColor: function(color) {
        	this.color = color;
        	return this;
        },
        setTextColor: function(color) {
        	this.textColor = color;
        	return this;
        },
        setFontSize: function(size) {
        	this.fontSize = size;
        	return this;
        },
        circle: function(params) {
			this.container.appendChild(this.addSVG("circle", params));
			return this;
        },
        rect: function(params) {
			this.container.appendChild(this.addSVG("rect", params));
        	return this;
        },
        line: function(params) {
			this.container.appendChild(this.addSVG("line", params));
        	return this;
        },
        path: function(params) {
			this.container.appendChild(this.addSVG("path", params));
        	return this;
        },
        text: function(params, text) {
			this.container.appendChild(this.addSVG("text", params)).appendChild(document.createTextNode(text.toString()));
			return this;
		},
		textBlock: function(params, text) {
			this.container.appendChild(this.addSVG("foreignObject", params)).appendChild(this.addHTML('div', text, params));
			// todo: support svg-only text pagination
			return this;
		},
        addCircle: function(params) {
	        var coord = this.getCoord(params);
        	this.circle({
        		cx: coord.x,
        		cy: coord.y,
				r: params.r,
				stroke: null,
				fill: (params.color != null) ? params.color : "#f00",
				style: "stroke-width:0",
				id: params.id
			});
        	return this;
        },
        placeBlock: function(params) {

            var result = null;
            var attemptCount = 0;

            while (!result) {
                var coord = {
                    x: Math.ceil(Math.random()*(1 + this.grid.columns - params.width - 2)),
                    y: Math.ceil(Math.random()*(1 + this.grid.rows - params.height - 2))
                }
                var freeSpace = true;
                for (var i=-1; i<params.width+1; i++) {
                    for (var j=-1; j<params.height+1; j++) {
                        if (this.grid.matrix[coord.x + i][coord.y + j]) {
                            freeSpace = false;
                        }
                    }
                }
                if (freeSpace) {
                    result = coord;
                    break;    
                }
                
                if (++attemptCount > 100) {
                    throw "No free space available";
                }
            }
            
            return result;
        },
        addBlock: function(params) {

            var width = this.getMeasure(params.width, 'width');
            var height = this.getMeasure(params.height, 'height');

            if (params.x && params.y) {
                var coord = this.getCoord(params);
            } else {    
                var target = this.placeBlock(params)
                params.x = target.x;
                params.y = target.y;
                var coord = this.getCoord(target);
            }

            this.rect({
                x: coord.x,
                y: coord.y,
                width: width,
                height: height,
                stroke: params.border ? params.border : this.color,
                fill: params.fill ? params.fill : "none",
                style: "stroke-width:1",
                id: this.getObjectID("block", params.title)
            }); 
            this.objectIDs.push(this.getObjectID("block", params.title));
            this.updateGridAllocation(params);

			var fontSize = this.getFontSize(params);
			if (params['title'].length*fontSize < width) {
				this.text( { 
					x: coord.x + width/2,
					y: coord.y + height/2,
					fill: this.textColor ? this.textColor : "#fff",
					style: this.getSVGFontStyle(params),
					id: this.getObjectID("text", params.title)
					}, params.title); 
			} else {
				this.textBlock( { 
					x: coord.x,
					y: coord.y,
					width: width,
					height: height,
					color: this.textColor ? this.textColor : "#fff",
					style: this.getHTMLFontStyle(params, width, height),
					id: this.getObjectID("text", params.title)
					}, params.title); 
			}
			this.objectIDs.push(this.getObjectID("text", params.title));

        	this.blockMap[params.title] = {
        		coord: coord,
        		width: width,
        		height: height,
        		center: {x: coord.x + width/2, y: coord.y + height/2},
        		pads: [ {x: coord.x + width/2, y: coord.y}, 
        				{x: coord.x + width/2, y: coord.y + height},
        				{x: coord.x, y: coord.y + height/2}, 
        		      	{x: coord.x + width, y: coord.y + height/2} ]
        	}

        	return this;
        },
        addWire: function(params) {
        	var coords = []
        	if (params.path) {	// explicit grid path 
        		if (this.grid) {
        			for (var i=0; i<params.path.length; i++) {
        				var el = params.path[i];
        				coords.push([this.getMeasure(el[0],"width"), this.getMeasure(el[1], "height")]);
        			}
        		} else {
        			coords = params.path;
        		}
        	} else {	// autorouter
	        	var start = this.blockMap[params.start].pads;
	        	var end = this.blockMap[params.end].pads;
	        	coords = this.getRoute(start, end)
			}
			this.path( {
				d: "M" + coords.map(function(x) { return x.join(" ")}).join(" L") + "",
				"stroke-width": 1,
				fill: "none",
				stroke: this.color ? this.color : "#fff",
				id: this.getObjectID("path", [params.start,params.end])
			})
			this.objectIDs.push(this.getObjectID("path", [params.start,params.end]))
			return this;
        },
        enableBlock(params) {
        	var el = document.getElementById(this.getObjectID("block", params.title));
        	var fill = el.getAttribute("fill");
        	el.setAttribute("fill", this.color);
        	el.setAttribute("fill-opacity", params.opacity ? params.opacity : 1.0);
        	return this;
        },
        disableBlock(params) {
        	var el = document.getElementById(this.getObjectID("block", params.title));
        	var fill = el.getAttribute("fill");
			el.setAttribute("fill", null);
        	return this;
        },
        toggleBlock(params) {
        	var el = document.getElementById(this.getObjectID("block", params.title));
        	var fill = el.getAttribute("fill");
        	if (fill === "none") {
	        	el.setAttribute("fill", this.color);
	        	el.setAttribute("fill-opacity", params.opacity ? params.opacity : 1.0);
        	} else {
	        	el.setAttribute("fill", null);
        	}
        	return this;
        },
        toggleWire(params) {
        	var el = document.getElementById(this.getObjectID("path", [params.start,params.end]));
        	var width = el.getAttribute("stroke-width");
        	if (width == 1) {
        		el.setAttribute("stroke-width", 2);
        	}
        	return this;
        },
        showGrid(opacity) {
        	if (!opacity) { opacity = 1.0 }
        	if (this.grid) {
        		for (var i=0; i<this.grid.columns; i++) {
					this.line({
						x1: i*(this.grid.cellWidth + this.grid.columnGutter), y1: 0,
						x2: i*(this.grid.cellWidth + this.grid.columnGutter), y2: this.height,
						stroke: "rgba(255,255,255," + opacity + ")", "stroke-width": 1
					});
        		}
    			for (var i=0; i<this.grid.columns; i++) {
					this.line({
						x1: 0, y1: i*(this.grid.cellHeight + this.grid.rowGutter), 
						x2: this.width,  y2: i*(this.grid.cellHeight + this.grid.rowGutter),
						stroke: "rgba(255,255,255," + opacity + ")", "stroke-width": 1
					});
    			}
        	}
        	return this;
        },
        setInteractive: function() {
        	for (var i=0; i<this.objectIDs.length; i++) {
        		var el = document.getElementById(this.objectIDs[i]);
        		var id = el.getAttribute("id")
        		var type = id.split(";")[0]
        		if (type === "path") {
	        		el.addEventListener("mouseover", function(event) {
	        			this.setAttribute("stroke-width", 3)
	        		});
	        		el.addEventListener("mouseout", function(event) {
	        			this.setAttribute("stroke-width", 1)
	        		});
        		} else if (type === "text") {
	        		el.addEventListener("mouseover", function(event) {
				        var id = this.getAttribute("id")
				        var block = document.getElementById("block;" + id.split(";")[1])
				        if (block) { block.setAttribute("fill", "rgba(255,255,255,0.1)") }        				
	        		});
	        		el.addEventListener("mouseout", function(event) {
				        var id = this.getAttribute("id")
				        var block = document.getElementById("block;" + id.split(";")[1])
				        if (block) { block.setAttribute("fill", "none") }        				
	        		});
        		}
        	}
        },
        setHandler: function(params, eventType, callback) {
        	var objects = this.findObjects(params);
        	objects.map(function(el) { if (el != null) { el.addEventListener(eventType, callback) } })
        	return this;
        }
    };
    
    BlockDiagram.init.prototype = BlockDiagram.prototype;
    global.BlockDiagram = BlockDiagram;

}(window));