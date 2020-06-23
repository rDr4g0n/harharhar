const { scaleLinear } = require("d3-scale");

const csv = stats => '"name","network","total","count"\n' +
  stats.map(s => `"${s.name}","${Math.floor(s.networkTime/1000)}","${Math.floor(s.duration/1000)}","${s.count}"`).join("\n")

const json = stats => JSON.stringify(stats, null, "  ")

const html = stats => {
  const msToS = ms => Math.floor(ms / 1000)

  const style = `<style>
    * { font-family: arial, sans-serif; margin: 0; padding: 0; }
    body { padding: 10px; }
    table { border-collapse: collapse; }
    td.number, th.number { text-align: right; }
    td { padding: 2px 5px; border-bottom: solid #CCC 1px; }
    td.viz { padding: 0; }
    .viz-wrap { position: relative; width: 100%; height: 5px; background-color: #DDD; }
    .interval { position: absolute; top: 0; left: 0; height: 5px; background-color: black; }
  </style>`;

  const VIZ_WIDTH = 200;

  const header = `<tr>
    <th>Name</th>
    <th width="100" class="number">Network (seconds)</th>
    <th width="100" class="number">Total Time (seconds)</th>
    <th width="100" class="number">Request Count</th>
    <th width="${VIZ_WIDTH}">Request Timeline</th>
  <tr>`;

  const xScale = scaleLinear()
    .domain([
      0,
      stats.reduce((acc, s) => Math.max(acc, s.duration), 0)
    ])
    .range([0, VIZ_WIDTH]);
  const toViz = s => {
    return `<div class="viz-wrap">${s.intervals.map(i => `
      <div class="interval" style="left: ${xScale(i[0])}px; width: ${xScale(i[1]-i[0])}px;"></div>
    `).join("")}</div>`
  } 

  const toRow = s => `<tr>
    <td>${s.name}</td>
    <td class="number">${msToS(s.networkTime)}</td>
    <td class="number">${msToS(s.duration)}</td>
    <td class="number">${s.count}</td>
    <td class="viz">${toViz(s)}</td>
  </tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Stats</title>
    ${style}
  </head>
  <body>
    <table>
      ${header}
      ${stats.map(toRow).join("")}
    </table>
  </body>
</html>`
}

module.exports = {
  csv,
  json,
  html
}
