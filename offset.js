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
        self.id = "bd-" + Math.floor(Math.random()*1024)
        self.container = document.getElementById(el);
        self.anchor = {x: params.x, y: params.y};
        self.width = params.width;
        self.height = params.height;
        self.blockMap = {};
        self.objectIDs = [];
    }
    
    BlockDiagram.prototype = {

    	// -- internal functions --- 
		
        // create svg object
		addSVG: function(tag, attrs) {	
			var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
			for (var k in attrs) {
				el.setAttribute(k, attrs[k]);
			}
			return el;
		},
        // create html object
		addHTML: function(tag, text, attrs) {
			var el = document.createElementNS('http://www.w3.org/1999/xhtml', tag);
			for (var k in attrs) {
				el.setAttribute(k, attrs[k]);
			}
			el.textContent = text;
			return el;
		},
        // get absolute coordinates 
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
        // get absolute distance
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
        // svg font rendering params
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
        // html (css flexbox) font rendering params
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
        // get unique object hash
        objectHash: function(s) {
        	if (s == null) { return "" }
			var h = 0, l = s.length, i = 0;
			if ( l > 0 )
				while (i < l) {
					h = (h << 5) - h + s.charCodeAt(i++) | 0;
				}
			return h;
        },
        // create a unique (namespace, title) object id
        createObjectID: function(type, title) {
        	if (!Array.isArray(title)) {
	        	return this.id + ";" + type + ";" + this.objectHash(title);
	        } else {
	        	var key = [];
	        	for (var i=0; i<title.length; i++) {
	        		key.push(this.objectHash(title[i]));
	        	}
                return this.getObjectID(type, key);
	        }
        },
        getObjectID: function(type, key) {
            return this.id + ";" + type + ";" + (Array.isArray(key) ? key.join(";") : key);
        },
        // get an enclosing block for a given object
        getBlockWrapper: function(object, container) {
            var id = object.getAttribute("id")
            var blockID = container.getObjectID("block", id.split(";")[2])
            return document.getElementById(blockID)
        },
        getJSONHash: function(el) {
        	return this.objectHash(JSON.stringify(el));
        },
        // each wire is addressed by a (order-insensitive) list of endpoints
        getWireTitle: function(entries) {
        	return entries.sort().join(";");
        },
        // find a dom object 
        findObjects: function(params) {
        	var results = []        
        	if (params.start && params.end) {
        		results.push(document.getElementById(this.createObjectID("path", [params.start,params.end])))
			} else {
				results.push(document.getElementById(this.createObjectID("text", params.title)));
        		results.push(document.getElementById(this.createObjectID("block", params.title)));
			}
			return results;
        },
        // create a binary grid matrix
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
        // check whether a given (absolute) location coord is occupied
        isOccupied: function(coord) {   
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
        // is coordinate within graph bounds ?
        isWithinBounds: function(coord) {
        	return (coord.x > 0) && (coord.y > 0) && (coord.x < this.width) && (coord.y < this.height)        	
        },
        // get a given coord's neighbor coords
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
        // l1 distance between coords
        getDistance: function(node1, node2) {
            return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y)
        },
        // sort by l2 distance
        distanceSort: function(target) {
        	return function(a, b) {
        		var d1 = Math.sqrt(Math.pow(a.x - target.x,2) + Math.pow(a.y - target.y,2));
        		var d2 = Math.sqrt(Math.pow(b.x - target.x,2) + Math.pow(b.y - target.y,2));
        		return d2 - d1
        	}
        },
        // simple bfs-based wire routing
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
        // get the best route between two sets of block pads
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
        // get callback handler for a given graph
        getCallbackHandler: function(handler) {
            var container = this;
            return function(event) {
                return handler(event, this, container);
            }
        },


        // --- public functions --- 

        // setup the underlying render grid
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
        // update grid allocation map with newly created objects
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
        // set graph background color
        setBackground: function(params) {
			this.rect({
				x: 0,
				y: 0,
				width: this.width,
				height: this.height,
				stroke: null,
				fill: params.color,
                "stroke-width": 0
			});	
        	return this;
        },
        // configure layout (grid vs. absolute)
        setLayout: function(layoutType) {
        	this.layout = layoutType;
        	return this;
        },
        // set primary wire/border/fill color
        setColor: function(color) {
        	this.color = color;
        	return this;
        },
        // set primary text color
        setTextColor: function(color) {
        	this.textColor = color;
        	return this;
        },
        // set the default font size
        setFontSize: function(size) {
        	this.fontSize = size;
        	return this;
        },
        // svg primitive rendering
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
        // text wrapped in a css flexbox (for automated pagination)
		textBlock: function(params, text) {
			this.container.appendChild(this.addSVG("foreignObject", params)).appendChild(this.addHTML('div', text, params));
			// todo: support svg-only text pagination
			return this;
		},
        // add circle object
        addCircle: function(params) {
	        var coord = this.getCoord(params);
        	this.circle({
        		cx: coord.x,
        		cy: coord.y,
				r: params.r,
				stroke: null,
				fill: (params.color != null) ? params.color : "#f00",
                "stroke-width": 0,
				id: params.id
			});
        	return this;
        },
        // place block on the grid
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
        // get a list of connection pads for a given block
        getBlockPads: function(coord, width, height) {
            var pads = [];            
            if (width < this.width*0.5 && height < this.width*0.5) {
                var offsets = [[width/2,0], [width/2,height], [0, height/2, width, height/2]];
            } else {
                var offsets = [[width*0.25,0], [width*0.5,0], [width*0.75,0], 
                               [width,height*0.25], [width,height*0.5], [width,height*0.75],
                               [width*0.75,height], [width*0.5,height], [width*0.25,height],
                               [0,height*0.75], [0,height*0.5], [0,height*0.25]];
            }
            for (var i=0; i<offsets.length; i++) {
                pads.push({ x: coord.x + offsets[i][0], y: coord.y + offsets[i][1]} );
            }
            return pads;
        },
        // add new block to the diagram
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
                selected: false,
                "stroke-width": 1,
                id: this.createObjectID("block", params.title)
            }); 
            this.objectIDs.push(this.createObjectID("block", params.title));
            this.updateGridAllocation(params);

			var fontSize = this.getFontSize(params);
			if (params['title'].length*fontSize < width) {
				this.text( { 
					x: coord.x + width/2,
					y: coord.y + height/2,
					fill: this.textColor ? this.textColor : "#fff",
					style: this.getSVGFontStyle(params),
					id: this.createObjectID("text", params.title)
					}, params.title); 
			} else {
				this.textBlock( { 
					x: coord.x,
					y: coord.y,
					width: width,
					height: height,
					color: this.textColor ? this.textColor : "#fff",
					style: this.getHTMLFontStyle(params, width, height),
					id: this.createObjectID("text", params.title)
					}, params.title); 
			}
			this.objectIDs.push(this.createObjectID("text", params.title));

        	this.blockMap[params.title] = {
        		coord: coord,
        		width: width,
        		height: height,
        		center: {x: coord.x + width/2, y: coord.y + height/2},
        		pads: this.getBlockPads(coord, width, height)
        	}

        	return this;
        },
        // add a wire between two blocks
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
				id: this.createObjectID("path", [params.start,params.end])
			})
			this.objectIDs.push(this.createObjectID("path", [params.start,params.end]))
			return this;
        },
        // set block as active
        enableBlock(params) {
        	var el = document.getElementById(this.createObjectID("block", params.title));
        	var fill = el.getAttribute("fill");
        	el.setAttribute("fill", this.color);
        	el.setAttribute("fill-opacity", params.opacity ? params.opacity : 1.0);
        	return this;
        },
        // set block as inactive
        disableBlock(params) {
        	var el = document.getElementById(this.createObjectID("block", params.title));
        	var fill = el.getAttribute("fill");
			el.setAttribute("fill", null);
        	return this;
        },
        // toggle the block 
        toggleBlock(params) {
        	var el = document.getElementById(this.createObjectID("block", params.title));
        	var fill = el.getAttribute("fill");
        	if (fill === "none") {
	        	el.setAttribute("fill", this.color);
	        	el.setAttribute("fill-opacity", params.opacity ? params.opacity : 1.0);
        	} else {
	        	el.setAttribute("fill", null);
        	}
        	return this;
        },
        // toggle the wire
        toggleWire(params) {
        	var el = document.getElementById(this.createObjectID("path", [params.start,params.end]));
        	var width = el.getAttribute("stroke-width");
        	if (width == 1) {
        		el.setAttribute("stroke-width", 2);
        	}
        	return this;
        },
        // render the underlying grid
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
        // add basic interactivity to the rendered diagram
        setInteractive: function() {
        	for (var i=0; i<this.objectIDs.length; i++) {
        		var el = document.getElementById(this.objectIDs[i]);
        		var id = el.getAttribute("id")
        		var type = id.split(";")[1]
        		if (type === "path") {
	        		el.addEventListener("mouseover", function(event) {
	        			this.setAttribute("stroke-width", 3)
	        		});
	        		el.addEventListener("mouseout", function(event) {
	        			this.setAttribute("stroke-width", 1)
	        		});
        		} else if (type === "text") {
                    el.addEventListener("mouseover", this.getCallbackHandler(function(event, object, container) {
                        var block = container.getBlockWrapper(object, container);
                        var selected = (block.getAttribute("selected") === 'true')
                        if (block) { 
                            block.setAttribute("fill", "rgba(255,255,255,0.2)") 
                        } 
                    }));
                    el.addEventListener("mouseout", this.getCallbackHandler(function(event, object, container) {
                        var block = container.getBlockWrapper(object, container);
                        if (block) { block.setAttribute("fill", "none") }
                    }));

                    el.addEventListener("mousemove", this.getCallbackHandler(function(event, object, container) {
                        var block = container.getBlockWrapper(object, container);
                        if (block) { 
                            var selected = (block.getAttribute("selected") === 'true')
                            if (selected) {
                                var width = parseInt(object.getAttribute("width"));
                                var height = parseInt(object.getAttribute("height"));
                                block.setAttribute("x", event.clientX-width/2);
                                object.setAttribute("x", event.clientX-width/2);
                                block.setAttribute("y", event.clientY-height/2);
                                object.setAttribute("y", event.clientY-height/2);
                            }
                        }
                    }));

                    el.addEventListener("click", this.getCallbackHandler(function(event, object, container) {
                        var block = container.getBlockWrapper(object, container);
                        if (block) { 
                            var selected = (block.getAttribute("selected") === 'true')
                            if (!selected) {
                                block.setAttribute("stroke-width", 5);        
                                block.setAttribute("selected", true);
                            } else {
                                block.setAttribute("stroke-width", 1);
                                block.setAttribute("selected", false);
                            }
                         }
                    }));
        		}
        	}
        }
    };
    
    BlockDiagram.init.prototype = BlockDiagram.prototype;
    global.BlockDiagram = BlockDiagram;

}(window));