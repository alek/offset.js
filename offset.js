/*!
 * Offset.js: Simple SVG Set Visualization Library
 * (c) 2020 Aleksandar Bradic
 *
 * Released under the MIT License.
 */

(function(global) {

    if(!global) {
        throw "Global Window object is not available.";
    }

    var BlockDiagram = function(el, params) {
        return new BlockDiagram.init(el, params);
    }

    BlockDiagram.init = function(el, params) {
        var self = this;
        self.container = document.getElementById(el);
        self.anchor = {x: params['x'], y: params['y']};
        self.width = params['width'];
        self.height = params['height'];
        self.blockMap = {}
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
				if ((params['x'] != null) && (params['y'] != null)) {
			        return {'x': params['x']*(this.grid['cellWidth'] + this.grid['rowGutter']),
			        		'y': params['y']*(this.grid['cellHeight'] + this.grid['columnGutter'])
		    	    	}
				} else {
					throw "Grid coordinates missing."
				}
    	    } else {
		        return {'x': this.width*Math.random(),
		        		'y': this.height*Math.random()
	    	    }
	    	}
        },
        getMeasure: function(val, type) {
        	if (!this.grid) {
        		return val;
        	} else {
        		if (type === 'width') {
        			return val*(this.grid['cellWidth'] + this.grid['rowGutter'])
        		} else if (type === 'height') {
        			return val*(this.grid['cellHeight'] + this.grid['columnGutter'])
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
				"font-size": params['fontSize'] ? params['fontSize'] : (this.fontSize ? this.fontSize : 10),
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
				"font-size": params['fontSize'] ? params['fontSize'] : (this.fontSize ? this.fontSize : 10),
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
			  var h = 0, l = s.length, i = 0;
			  if ( l > 0 )
			    while (i < l) {
			      h = (h << 5) - h + s.charCodeAt(i++) | 0;
			    }
			  return h;
        },
        getObjectID: function(type, title) {
        	if (!Array.isArray(title)) {
	        	return type + "-" + this.objectHash(title);
	        } else {
	        	var key = []
	        	for (var i=0; i<title.length; i++) {
	        		key.push(this.objectHash(title[i]))
	        	}
	        	return type + "-" + key.join(";")
	        }
        },
        getWireTitle: function(entries) {
        	return entries.sort().join("-");
        },
        findObjects: function(params) {
        	var results = []        
        	if (params["start"] && params["end"]) {
        		results.push(document.getElementById(this.getObjectID("path", [params["start"],params["end"]])))
			} else {
				results.push(document.getElementById(this.getObjectID("text", params["title"])))	
        		results.push(document.getElementById(this.getObjectID("block", params["title"])));
			}
			return results;
        },
        // --- public functions --- 

        setGrid: function(config) {
        	this.grid = {
        		rows: config['rows'],
        		columns: config['columns'],
        		columnGutter: 0,
        		rowGutter: 0,
        		cellHeight: this.height/config['rows'],
        		cellWidth: this.width/config['columns']
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
				fill: params['color'],
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
        path: function(params) {
			this.container.appendChild(this.addSVG("path", params));
        	return this;
        },
        text: function(params, text) {
			this.container.appendChild(this.addSVG('text', params)).appendChild(document.createTextNode(text.toString()));
			return this;
		},
		textBlock: function(params, text) {
			this.container.appendChild(this.addSVG("foreignObject", params)).appendChild(this.addHTML('div', text, params));
			// todo: support svg-only text pagination
			return this;
		},
        addCircle: function(params) {
	        var coord = this.getCoord(params)
        	this.circle({
        		cx: coord['x'],
        		cy: coord['y'],
				r: params['r'],
				stroke: null,
				fill: (params['color'] != null) ? params['color'] : "#f00",
				style: "stroke-width:0",
				id: params['id']
			});
        	return this;
        },
        addBlock: function(params) {
        	var coord = this.getCoord(params);
        	var width = this.getMeasure(params['width'], 'width');
        	var height = this.getMeasure(params['height'], 'height');
			this.rect({
				x: coord['x'],
				y: coord['y'],
				width: width,
				height: height,
				stroke: params['border'] ? params['border'] : this.color,
				fill: params['fill'] ? params['fill'] : "none",
				style: "stroke-width:1",
				id: this.getObjectID("block", params['title'])
			});	

			var fontSize = this.getFontSize(params);
			if (params['title'].length*fontSize < width) {
				this.text( { 
					x: coord['x'] + width/2,
					y: coord['y'] + height/2,
					"fill": this.textColor ? this.textColor : "#fff",
					"style": this.getSVGFontStyle(params),
					id: this.getObjectID("text", params['title'])
					}, params['title']); 
			} else {
				this.textBlock( { 
					x: coord['x'],
					y: coord['y'],
					width: width,
					height: height,
					"color": this.textColor ? this.textColor : "#fff",
					"style": this.getHTMLFontStyle(params, width, height),
					id: this.getObjectID("text", params['title'])
					}, params['title']); 
			}

        	this.blockMap[params["title"]] = {
        		"coord": coord,
        		"width": width,
        		"height": height,
        		"center": {'x': coord['x'] + width/2, 'y': coord['y'] + height/2}
        	}

        	return this;
        },
        addWire: function(params) {
        	var coords = []
        	if (params["path"]) {	
        		if (this.grid) {
        			for (var i=0; i<params["path"].length; i++) {
        				var el = params["path"][i];
        				coords.push([this.getMeasure(el[0],"width"), this.getMeasure(el[1], "height")]);
        			}
        		} else {
        			coords = params["path"];
        		}
        	} else {	
	        	var start = this.blockMap[params["start"]]['center'];
	        	var end = this.blockMap[params["end"]]['center'];
	        	coords = [[start['x'], start['y']], [end['x'], end['y']]];
			}
			this.path( {
				d: "M" + coords.map(function(x) { return x.join(" ")}).join(" L") + "",
				"stroke-width": 1,
				"fill": "none",
				"stroke": this.color ? this.color : "#fff",
				id: this.getObjectID("path", [params["start"],params["end"]])
			})
			return this;
        },
        toggleBlock(params) {
        	var el = document.getElementById(this.getObjectID("block", params["title"]));
        	var fill = el.getAttribute("fill");
        	if (fill === "none") {
	        	el.setAttribute("fill", this.color);
	        	el.setAttribute("fill-opacity", params["opacity"] ? params["opacity"] : 1.0);
	        	el.setAttribute("stroke", null);
        	} else {
	        	el.setAttribute("fill", null);
	        	el.setAttribute("stroke", this.color);
        	}
        	return this;
        },
        toggleWire(params) {
        	var el = document.getElementById(this.getObjectID("path", [params["start"],params["end"]]));
        	var width = el.getAttribute("stroke-width");
        	if (width == 1) {
        		el.setAttribute("stroke-width", 2);
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