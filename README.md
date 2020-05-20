# offset.js

Simple grid-based SVG layout library. Ideal for block diagram rendering & general-purpose set visualization.

No external dependencies, no data bindings. Layout & event handling only. 

*Work in progress, please come back later*

#### Usage ####


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

      graph.addWire({"path": [[14,7], [15,7], [15,9], [16,9] ]})
      graph.addWire({"path": [[14,14], [18,14], [18,13]]})
```
Output:
![Output](https://user-images.githubusercontent.com/54517/82421251-98757480-9a35-11ea-8949-0985955572bb.png)
