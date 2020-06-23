const { scaleLinear } = require("d3-scale");

const csv = stats => '"name","network","total","count"\n' +
  stats.map(s => `"${s.name}","${Math.floor(s.networkTime/1000)}","${Math.floor(s.duration/1000)}","${s.count}"`).join("\n")

const json = stats => JSON.stringify(stats, null, "  ")

const html = stats => {
  const msToS = ms => Math.floor(ms / 1000)

  const style = `<style>
    * { font-family: arial, sans-serif; margin: 0; padding: 0; font-size: 20px; }
    body { padding: 10px; }
    table { border-collapse: collapse; }
    td.number { text-align: right; }
    td { padding: 2px 8px; border-bottom: solid #CCC 1px; }
    .viz-wrap { width: 100%; display: flex; align-items: center; }
    .viz-timeline { position: relative; width: 100%; height: 10px; background-color: #CCC; }
    .viz-total { font-size: 14px; padding-left: 4px; }
    .interval { position: absolute; top: 0; left: 0; height: 10px; background-color: black; }
    .interval.okta { background-color: deeppink; }
  </style>`;

  const VIZ_PADDING = 16;
  const VIZ_WIDTH = 300;

  const header = `<tr>
    <th>Name</th>
    <th width="100" class="number">Network (seconds)</th>
    <th width="${VIZ_WIDTH}">Request Timeline<br>(pink = okta)</th>
  <tr>`;

  const xScale = scaleLinear()
    .domain([
      0,
      stats.reduce((acc, s) => Math.max(acc, s.duration), 0)
    ])
    .range([0, VIZ_WIDTH - VIZ_PADDING]);
  const toViz = s => {
    return `<div class="viz-wrap">
      <div class="viz-timeline" style="width: ${xScale(s.duration)}px;">
        ${s.discreteOtherIntervals.map(i => `
          <div class="interval" style="left: ${xScale(i[0])}px; width: ${xScale(i[1]-i[0])}px;"></div>
        `).join("")}
        ${s.discreteOktaIntervals.map(i => `
          <div class="interval okta" style="left: ${xScale(i[0])}px; width: ${xScale(i[1]-i[0])}px;"></div>
        `).join("")}
      </div>
      <div class="viz-total">${msToS(s.duration)}s</div>
    </div>`
  } 

  const toRow = s => `<tr>
    <td>${s.name}</td>
    <td class="number">${msToS(s.networkTime)}</td>
    <td>${toViz(s)}</td>
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
