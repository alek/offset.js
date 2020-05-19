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
        getCoord: function(params) {
        	if (!this.grid) {
		        return {'x': this.width*Math.random(),
		        		'y': this.height*Math.random()
	    	    	}
			} else {
				if (params['x'] && params['y']) {
			        return {'x': params['x']*(this.grid['cellWidth'] + this.grid['rowGutter']),
			        		'y': params['y']*(this.grid['cellHeight'] + this.grid['columnGutter'])
		    	    	}
				} else {
					throw "Grid coordinates missing."
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
        // public
        setGrid: function(config) {
        	this.grid = {
        		rows: config['rows'],
        		columns: config['columns'],
        		columnGutter: 0,
        		rowGutter: 0,
        		cellHeight: this.width/config['rows'],
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
        circle: function(params) {
			this.container.appendChild(this.addSVG("circle", params));
			return this;
        },
        rect: function(params) {
			this.container.appendChild(this.addSVG("rect", params));
        	return this;
        },
        text: function(params, text, domID) {
			this.container.appendChild(addSVG('text', params)).appendChild(document.createTextNode(text))
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
        	let coord = this.getCoord(params)
			this.rect({
				x: coord['x'],
				y: coord['y'],
				width: this.getMeasure(params['width'], 'width'),
				height: this.getMeasure(params['height'], 'height'),
				stroke: params['color'],
				fill: params['color'],
				style: "stroke-width:1;"
			});	
        	return this;
        },
        setCallback: function(config, callback) {
        	return this;
        }
    };
    
    SetGraph.init.prototype = SetGraph.prototype;
    global.SetGraph = SetGraph;

}(window));
