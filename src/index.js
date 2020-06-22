#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { generateDiscreteIntervals } = require("./intervals");

const msFromDateTime = d => new Date(d).getTime()
const last = arr => arr[arr.length-1];
const msToS = ms => Math.floor(ms / 1000);

const analyzeHar = filename => {
  const har = fs.readFileSync(filename, "utf8");
  const harData = JSON.parse(har);

  const allEntries = harData.log.entries;
  let startIndex = allEntries.findIndex(e => e.request.url.includes("home"));
  let endIndex = allEntries.findIndex(e => e.request.url.includes("whatsnew"));

  if(startIndex === -1){
    // console.log("WARNING: could not find a starting point");
    startIndex = 0;
  }
  if(endIndex === -1){
    // console.log("WARNING: could not find an ending point");
    endIndex = allEntries.length - 1
  }

  const entries = allEntries.slice(startIndex, endIndex);

  const firstRequestTime = msFromDateTime(entries[0].startedDateTime);

  const duration = (
    msFromDateTime(last(entries).startedDateTime) +
    last(entries).time -
    firstRequestTime
  );

  const intervals = entries.map(e => {
    // NOTE - offset based on first request
    // TODO - include entry along with interval
    const began = msFromDateTime(e.startedDateTime) - firstRequestTime;
    return [began, began + e.time]
  });
  const discreteIntervals = generateDiscreteIntervals(intervals);
  // TODO - generate timeline
  // TODO - label cluster content
  // TODO - further subdivide by okta vs infoblox
  const networkTime = discreteIntervals.reduce((acc, [start, end]) => end - start + acc, 0);

  return {
    name: last(filename.split("/")),
    duration,
    networkTime,
    count: allEntries.length,
    intervals: discreteIntervals,
  };
};

const dirOrFile = process.argv[2];

if(!dirOrFile) {
  console.log("Please provide har file or directory containing har files");
  process.exit(1);
}

const dirOrFilePath = path.resolve(dirOrFile);

const fileStats = fs.lstatSync(dirOrFilePath);
let files = [dirOrFilePath];

if(fileStats.isDirectory()){
  files = fs.readdirSync(dirOrFilePath)
    .filter(name => name.endsWith("har"))
    .map(name => path.join(dirOrFilePath, name));
}

const stats = files.map(analyzeHar);

// TODO - get output format from cli
const AS_CSV = true;
const AS_JSON = false;

if(AS_CSV){
  const statsAsCSV = '"name","network","total","count"\n' +
    stats.map(s => `"${s.name}","${Math.floor(s.networkTime/1000)}","${Math.floor(s.duration/1000)}","${s.count}"`).join("\n")
  console.log(statsAsCSV);
}

if(AS_JSON) {
  console.log(JSON.stringify(stats, null, "  "));
}
