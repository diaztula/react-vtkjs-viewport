function MinMaxRange(n) {
  this.n = n;
  this.range = [];

  for (let i = 0; i < n; i += 1) {
    this.range.push({
      max: Number.NEGATIVE_INFINITY,
      min: Number.POSITIVE_INFINITY,
    });
  }
}

MinMaxRange.prototype.updateMinMaxRange = function(range) {
  if (this.n !== range.n) {
    throw new Error('Source and target range have different size');
  }
  for (let i = 0; i < this.n; i += 1) {
    this.range[i].min = Math.min(this.range[i].min, range.range[i].min);
    this.range[i].max = Math.max(this.range[i].max, range.range[i].max);
  }
};

MinMaxRange.prototype.getRangeI = function(i) {
  if (i >= this.n) {
    throw new Error('Range index out of bounds');
  }
  return {
    min: this.range[i].min,
    max: this.range[i].max,
  };
};

MinMaxRange.prototype.updateRangeI = function(i, value) {
  if (i >= this.n) {
    throw new Error('Range index out of bounds');
  }
  this.range[i].min = Math.min(this.range[i].min, value);
  this.range[i].max = Math.max(this.range[i].max, value);
};

export default MinMaxRange;
