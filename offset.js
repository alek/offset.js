/*!
 * Offset.js: Simple SVG Set Visualization Library
 * (c) 2020 Aleksandar Bradic
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
		addSVG: function(tag, attrs) {	
			var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
			for (var k in attrs) {
				el.setAttribute(k, attrs[k]);
			}
			return el;
		},
        setGrid: function(config) {
        	this.grid = {
        		rows: config['rows'],
        		columns: config['columns'],
        		rowGutter: 0,
        		columnGutter: 0,
        		cellHeight: this.width/config['rows'],
        		cellWidth: this.width/config['columns']
        	}
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
        getCoord: function(params) {
	        return {'x': this.width*Math.random(),
	        		'y': this.height*Math.random()
	        	}
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
        setCallback: function(config, callback) {
        	return this;
        }
    };
    
    SetGraph.init.prototype = SetGraph.prototype;
    global.SetGraph = SetGraph;

}(window));
