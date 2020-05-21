# offset.js

Simple grid-based SVG layout library. Ideal for no-frills block diagram rendering.

No external dependencies, no data bindings. Layout & event handling only. 

*Work in progress, please come back later.*

### Sample Usage ###

*Include the script*
```js
<script src="https://cdn.jsdelivr.net/gh/alek/offset.js@master/offset.js"></script>
```

*Create the target SVG container*
```html
<svg id="results" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="960" height="540"></
```
#### Block Diagram Setup ####

```js
      var graph = BlockDiagram("results", {width: 960, height: 540})
                      .setGrid({rows: 18, columns: 30})
                      .setLayout("grid")
                      .setBackground({color: "#F6F8FA"})
                      .setColor("#7748B0")
                      .setTextColor("#7748B0")
                      .setFontSize(14);

      graph.addBlock({x: 10, y: 5, width: 4, height: 4, title: "Random Title One"})
      graph.addBlock({x: 16, y: 5, width: 4, height: 8, title: "Title Number Two"})
      graph.addBlock({x: 10, y: 12, width: 4, height: 4, title: "And one more for good measure"})
```

##### Grid-based Manual Routing #####

```js
      graph.addWire({"path": [[14,7], [15,7], [15,9], [16,9] ]})
      graph.addWire({"path": [[14,14], [18,14], [18,13]]})
```

*Output:*
![Manual Grid Routed Diagram](https://user-images.githubusercontent.com/54517/82421251-98757480-9a35-11ea-8949-0985955572bb.png)

##### Simple Autorouter #####

```js
      graph.addWire({"start": "Random Title One", "end": "Title Number Two"})
      graph.addWire({"start": "Random Title One", "end": "And one more for good measure"})
```

*Output:*
![Autorouted Diagram](https://user-images.githubusercontent.com/54517/82588428-a5868680-9b4f-11ea-84ee-84563a5912a7.png)
