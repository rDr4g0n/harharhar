module.exports = {
  csv: stats => '"name","network","total","count"\n' +
      stats.map(s => `"${s.name}","${Math.floor(s.networkTime/1000)}","${Math.floor(s.duration/1000)}","${s.count}"`).join("\n"),

  json: stats => JSON.stringify(stats, null, "  "),

  html: stats => "<html></html>"
}
