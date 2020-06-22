#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const { generateDiscreteIntervals } = require("./intervals");

const msFromDateTime = d => new Date(d).getTime()
const last = arr => arr[arr.length-1];
const msToS = ms => Math.floor(ms / 1000);

function analyzeHar(filename) {
  const har = fs.readFileSync(filename, "utf8");
  const harData = JSON.parse(har);

  const allEntries = harData.log.entries;
  let startIndex = allEntries.findIndex(e => e.request.url.includes("home"));
  let endIndex = allEntries.findIndex(e => e.request.url.includes("whatsnew"));

  if(startIndex === -1){
    process.stderr.write(`WARNING: could not find starting point for ${filename}\n`);
    startIndex = 0;
  }
  if(endIndex === -1){
    process.stderr.write(`WARNING: could not find ending point for ${filename}\n`);
    endIndex = allEntries.length - 1
  }

  const entries = allEntries.slice(startIndex, endIndex)
    .sort((a, b) => msFromDateTime(a.startedDateTime) - msFromDateTime(b.startedDateTime));

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

function cli({ dirOrFile, csv, json }){
  const dirOrFilePath = path.resolve(dirOrFile);

  const fileStats = fs.lstatSync(dirOrFilePath);
  let files = [dirOrFilePath];

  if(fileStats.isDirectory()){
    files = fs.readdirSync(dirOrFilePath)
      .filter(name => name.endsWith("har"))
      .map(name => path.join(dirOrFilePath, name));
  }

  const stats = files.map(analyzeHar);

  if(csv){
    const statsAsCSV = '"name","network","total","count"\n' +
      stats.map(s => `"${s.name}","${Math.floor(s.networkTime/1000)}","${Math.floor(s.duration/1000)}","${s.count}"`).join("\n")
    console.log(statsAsCSV);
  }

  if(json) {
    console.log(JSON.stringify(stats, null, "  "));
  }
}

const optionDefs = [
  { name: "dirOrFile", type: String, defaultOption: true, description: "Path to a har file or directory containing har files" },
  { name: "csv", type: Boolean, description: "output analysis in csv format" },
  { name: "json", type: Boolean, description: "output analysis in json format" },
  { name: "help", alias: "h", type: Boolean, description: "display this help" }
];
const options = commandLineArgs(optionDefs);

if (options.help || !options.dirOrFile) {
  console.log(commandLineUsage([{
    header: 'Options',
    optionList: optionDefs
  }]));
  process.exit();
}

if(!options.csv && !options.json){
  options.json = true;
}

cli(options);
