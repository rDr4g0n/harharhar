const IntervalTree = require("@flatten-js/interval-tree").default;

module.exports.generateDiscreteIntervals = (intervals) => {
  const tree = new IntervalTree();
  intervals.map(interval => tree.insert(interval));

  function intersect(interval, tree){
    const intervals = tree.search(interval);
    if(!intervals.length){
      return;
    }
    const mergedInterval = [
      intervals[0][0],
      intervals[intervals.length-1][1]
    ];
    intervals.map(i => tree.remove(i));
    tree.insert(mergedInterval);
    return true;
  }

  // TODO - probably more efficient way to do this?
  intervals.forEach(interval => {
    intersect(interval, tree);
  });

  return tree.values;
}
