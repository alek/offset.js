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

    var SetGraph = function(el, params) {
        return new SetGraph.init(el, params);
    }

    SetGraph.init = function(el, params) {
        var self = this;
        self.container = document.getElementById(el);
        self.anchor = {x: params['x'], y: params['y']};
        self.width = params['width'];
        self.height = params['height'];
        self.blockMap = {}
    }
    
    SetGraph.prototype = {
    	// internal 
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
        	return this.fontSize ? this.fontSize : params
        },
        getSVGFontStyle: function(params) {
			let config = {
				"font-size": params['fontSize'] ? params['fontSize'] : (this.fontSize ? this.fontSize : 10),
				"text-align": "middle",
				"alignment-baseline": "middle",
				"text-anchor": "middle",
				"opacity": "1.0",
				"font-family": "Helvetica;sans-serif",
				"font-weight": 300,
				"letter-spacing": "0px"
			}
			return Object.keys(config).map(function(key) { return key + ":" + config[key]}).join(";")
        },
        getHTMLFontStyle: function(params, width, height) {
			let config = {
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
			return Object.keys(config).map(function(key) { return key + ":" + config[key]}).join(";")
        },
        getLineStyle: function(params) {
        	let config = {
        		"fill": "none",
        		"stroke": this.color ? this.color : "#fff",
        		"stroke-width": 1
        	}
			return Object.keys(config).map(function(key) { return key + ":" + config[key]}).join(";")
        },
        // public
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
			this.container.appendChild(this.addSVG('text', params)).appendChild(document.createTextNode(text.toString()))
			return this;
		},
		textBlock: function(params, text) {
			this.container.appendChild(this.addSVG("foreignObject", params)).appendChild(this.addHTML('div', text, params));
			// todo: support svg-only text pagination
			return this;
		},
        addCircle: function(params) {
	        let coord = this.getCoord(params)
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
        	let coord = this.getCoord(params);
        	let width = this.getMeasure(params['width'], 'width');
        	let height = this.getMeasure(params['height'], 'height');
			this.rect({
				x: coord['x'],
				y: coord['y'],
				width: width,
				height: height,
				stroke: params['border'] ? params['border'] : this.color,
				fill: params['fill'] ? params['fill'] : "none",
				style: "stroke-width:1"
			});	
			let fontSize = this.getFontSize(params)
			if (params['title'].length*fontSize < width) {
				this.text( { 
					x: coord['x'] + width/2,
					y: coord['y'] + height/2,
					"fill": this.textColor ? this.textColor : "#fff",
					"style": this.getSVGFontStyle(params),
					}, params['title']); 

			} else {
				this.textBlock( { 
					x: coord['x'],
					y: coord['y'],
					width: width,
					height: height,
					"color": this.textColor ? this.textColor : "#fff",
					"style": this.getHTMLFontStyle(params, width, height),
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
        	let coords = []
        	if (params["path"]) {	
        		if (this.grid) {
        			for (var i=0; i<params["path"].length; i++) {
        				let el = params["path"][i]
        				coords.push([this.getMeasure(el[0],"width"), this.getMeasure(el[1], "height")])
        			}
        		} else {
        			coords = params["path"]
        		}
        	} else {	
	        	let start = this.blockMap[params["start"]]['center']
	        	let end = this.blockMap[params["end"]]['center']
	        	coords = [[start['x'], start['y']], [end['x'], end['y']]]
			}
			this.path( {
				d: "M" + coords.map(function(x) { return x.join(" ")}).join(" L") + "",
				style: this.getLineStyle(params)
			})
        },
        setCallback: function(config, callback) {
        	return this;
        }
    };
    
    SetGraph.init.prototype = SetGraph.prototype;
    global.SetGraph = SetGraph;

}(window));