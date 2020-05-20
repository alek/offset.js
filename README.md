# offset.js

Simple grid-based SVG layout library. Ideal for block diagram rendering & general-purpose set visualization.

No external dependencies, no data bindings. Layout & event handling only. 

#### Usage ####


```js
      var graph = BlockDiagram("results", {width: 960, height: 540}).setGrid({rows: 18, columns: 30})
                  .setLayout("grid").setBackground({color: "#161638"}).setColor("#7748B0").setTextColor("#FFF").setFontSize(14);
```
