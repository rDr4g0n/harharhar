harharhar
==============

> A quick tool for parsing a har file to determine how long it took to log into a particular site

Usage
-------------
Install deps

    npm install

Then call the script with a har file

    ./src/index.js ~/path/to/harfile.har

Or a directory containing many har files

    ./src/index.js ~/path/to/myharfiles

You can set the output format to csv or json

    ./src/index.js --csv ~/path/to/harfile.har
    ./src/index.js --json ~/path/to/harfile.har

Save the output to a file with redirects

    ./src/index.js --csv ~/path/to/harfile.har > results.csv
