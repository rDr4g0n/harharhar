#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const { generateDiscreteIntervals } = require("./intervals");
const renderers = require("./renderers");

const msFromDateTime = d => new Date(d).getTime()
const last = arr => arr[arr.length-1];
const msToS = ms => Math.floor(ms / 1000);

const discreteIntervalsFromEntries = (entries, filter = val=>val) => {
  const firstRequestTime = msFromDateTime(entries[0].startedDateTime);
  return generateDiscreteIntervals(
    entries
      .filter(filter)
      .map(e => {
        // NOTE - offset based on first request
        // TODO - include entry along with interval
        const began = msFromDateTime(e.startedDateTime) - firstRequestTime;
        return [began, began + e.time]
      })
  );
}

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

  const discreteIntervals = discreteIntervalsFromEntries(entries)
  const networkTime = discreteIntervals.reduce((acc, [start, end]) => end - start + acc, 0);
  const discreteOktaIntervals = discreteIntervalsFromEntries(entries, e => e.request.url.includes("okta"));
  const discreteOtherIntervals = discreteIntervalsFromEntries(entries, e => !e.request.url.includes("okta"));

  return {
    name: last(filename.split("/")),
    duration,
    networkTime,
    count: allEntries.length,
    intervals: discreteIntervals,
    discreteOktaIntervals,
    discreteOtherIntervals
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

  console.log(renderers[options.output](stats));


}

const optionDefs = [
  { name: "dirOrFile", type: String, defaultOption: true, description: "Path to a har file or directory containing har files" },
  { name: "output", type: String, description: "output format. options are csv, json, html" },
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

if(!options.output){
  options.output = csv;
}
// TODO - validate renderer selection

cli(options);
