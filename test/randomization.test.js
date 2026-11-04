var assert = require('assert');

var LOWEST_FREQUENCY = 110;
var HIGHEST_FREQUENCY = 880;

function _rand(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function generateTones() {
  var firstFrequency = _rand(LOWEST_FREQUENCY, HIGHEST_FREQUENCY);
  var secondFrequency = _rand(LOWEST_FREQUENCY, HIGHEST_FREQUENCY);
  return { firstFrequency: firstFrequency, secondFrequency: secondFrequency };
}

var testsPassed = 0;
var testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    testsFailed++;
    console.log('  ✗ ' + name + ': ' + e.message);
  }
}

console.log('Randomization Tests\n');

console.log('_rand() bounds:');
test('returns an integer', function() {
  for (var i = 0; i < 100; i++) {
    var val = _rand(1, 10);
    assert.strictEqual(val % 1, 0, 'Expected integer, got ' + val);
  }
});

test('minimum bound is inclusive (low reachable)', function() {
  var reached = false;
  for (var i = 0; i < 10000; i++) {
    if (_rand(1, 10) === 1) {
      reached = true;
      break;
    }
  }
  assert(reached, 'Minimum value 1 was never reached in 10000 tries');
});

test('maximum bound is inclusive (high reachable)', function() {
  var reached = false;
  for (var i = 0; i < 10000; i++) {
    if (_rand(1, 10) === 10) {
      reached = true;
      break;
    }
  }
  assert(reached, 'Maximum value 10 was never reached in 10000 tries');
});

test('all values in range are reachable', function() {
  var min = 110;
  var max = 120;
  var seen = {};
  var iterations = 0;
  var total = max - min + 1;
  while (Object.keys(seen).length < total && iterations < 100000) {
    var val = _rand(min, max);
    seen[val] = true;
    iterations++;
  }
  assert.strictEqual(Object.keys(seen).length, total, 'Not all values in range [' + min + ', ' + max + '] were reached');
});

test('values never below minimum', function() {
  for (var i = 0; i < 1000; i++) {
    var val = _rand(LOWEST_FREQUENCY, HIGHEST_FREQUENCY);
    assert.ok(val >= LOWEST_FREQUENCY, 'Value ' + val + ' is below minimum ' + LOWEST_FREQUENCY);
  }
});

test('values never above maximum', function() {
  for (var i = 0; i < 1000; i++) {
    var val = _rand(LOWEST_FREQUENCY, HIGHEST_FREQUENCY);
    assert.ok(val <= HIGHEST_FREQUENCY, 'Value ' + val + ' is above maximum ' + HIGHEST_FREQUENCY);
  }
});

test('single-value range returns that value', function() {
  for (var i = 0; i < 100; i++) {
    assert.strictEqual(_rand(5, 5), 5);
  }
});

console.log('\ngenerateTones():');
test('first frequency is in range', function() {
  for (var i = 0; i < 100; i++) {
    var tones = generateTones();
    assert.ok(tones.firstFrequency >= LOWEST_FREQUENCY && tones.firstFrequency <= HIGHEST_FREQUENCY);
  }
});

test('second frequency is in range', function() {
  for (var i = 0; i < 100; i++) {
    var tones = generateTones();
    assert.ok(tones.secondFrequency >= LOWEST_FREQUENCY && tones.secondFrequency <= HIGHEST_FREQUENCY);
  }
});

test('both frequencies can differ (independence)', function() {
  var differed = false;
  for (var i = 0; i < 100; i++) {
    var tones = generateTones();
    if (tones.firstFrequency !== tones.secondFrequency) {
      differed = true;
      break;
    }
  }
  assert(differed, 'Both frequencies were always equal in 100 tries — likely not independent');
});

test('both frequencies can be equal', function() {
  var matched = false;
  for (var i = 0; i < 10000; i++) {
    var tones = generateTones();
    if (tones.firstFrequency === tones.secondFrequency) {
      matched = true;
      break;
    }
  }
  assert(matched, 'Frequencies never matched in 10000 tries — equal case should be possible');
});

test('first can be lower than second', function() {
  var found = false;
  for (var i = 0; i < 100; i++) {
    var tones = generateTones();
    if (tones.firstFrequency < tones.secondFrequency) {
      found = true;
      break;
    }
  }
  assert(found, 'First frequency was never lower than second in 100 tries');
});

test('first can be higher than second', function() {
  var found = false;
  for (var i = 0; i < 100; i++) {
    var tones = generateTones();
    if (tones.firstFrequency > tones.secondFrequency) {
      found = true;
      break;
    }
  }
  assert(found, 'First frequency was never higher than second in 100 tries');
});

console.log('\nResults: ' + testsPassed + ' passed, ' + testsFailed + ' failed\n');
process.exit(testsFailed > 0 ? 1 : 0);
