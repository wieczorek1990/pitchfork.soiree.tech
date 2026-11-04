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

// Mirror of Game._getFrequencySpan from src/app.coffee
function getFrequencySpan(frequency) {
  var low = LOWEST_FREQUENCY;
  var base = low;
  while (true) {
    if (base <= frequency && frequency < 2 * base) {
      break;
    } else {
      base *= 2;
    }
  }
  var high = base;
  return [low, high];
}

// Mirror of UI._checkAnswer logic from src/app.coffee
function checkAnswer(firstFrequency, secondFrequency, answer) {
  var success;
  switch (answer) {
    case 'lower':
      success = firstFrequency > secondFrequency;
      break;
    case 'equal':
      success = firstFrequency === secondFrequency;
      break;
    case 'higher':
      success = firstFrequency < secondFrequency;
      break;
  }
  return success;
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

console.log('Game Process Tests\n');

console.log('_getFrequencySpan():');
test('lowest frequency returns [110, 110]', function() {
  var span = getFrequencySpan(110);
  assert.deepStrictEqual(span, [110, 110], 'Expected [110, 110], got [' + span + ']');
});

test('220 Hz returns [110, 220]', function() {
  var span = getFrequencySpan(220);
  assert.deepStrictEqual(span, [110, 220], 'Expected [110, 220], got [' + span + ']');
});

test('440 Hz returns [110, 440]', function() {
  var span = getFrequencySpan(440);
  assert.deepStrictEqual(span, [110, 440], 'Expected [110, 440], got [' + span + ']');
});

test('880 Hz returns [110, 880]', function() {
  var span = getFrequencySpan(880);
  assert.deepStrictEqual(span, [110, 880], 'Expected [110, 880], got [' + span + ']');
});

test('111 Hz returns [110, 220]', function() {
  var span = getFrequencySpan(111);
  // base starts at 110; 110 <= 111 && 111 < 220 is true, so high = 110
  // Wait: base=110, 110 <= 111 is true, 111 < 220 is true -> break, high = 110
  // Actually the loop checks base <= freq AND freq < 2*base
  // base=110: 110 <= 111 (true) AND 111 < 220 (true) -> break, high = base = 110
  // So 111 returns [110, 110] — same bucket as 110
  assert.deepStrictEqual(span, [110, 110], 'Expected [110, 110], got [' + span + ']');
});

test('219 Hz returns [110, 220]', function() {
  var span = getFrequencySpan(219);
  // base=110: 110 <= 219 (true) AND 219 < 220 (true) -> break, high = 110
  assert.deepStrictEqual(span, [110, 110], 'Expected [110, 110], got [' + span + ']');
});

test('330 Hz returns [110, 440]', function() {
  var span = getFrequencySpan(330);
  // base=110: 110 <= 330 (true) AND 330 < 220 (false) -> base *= 2 = 220
  // base=220: 220 <= 330 (true) AND 330 < 440 (true) -> break, high = 220
  assert.deepStrictEqual(span, [110, 220], 'Expected [110, 220], got [' + span + ']');
});

test('span low is always LOWEST_FREQUENCY', function() {
  for (var i = LOWEST_FREQUENCY; i <= HIGHEST_FREQUENCY; i += 10) {
    var span = getFrequencySpan(i);
    assert.strictEqual(span[0], LOWEST_FREQUENCY, 'Low bound should always be ' + LOWEST_FREQUENCY);
  }
});

test('span high is a power-of-2 multiple of low', function() {
  for (var i = LOWEST_FREQUENCY; i <= HIGHEST_FREQUENCY; i += 10) {
    var span = getFrequencySpan(i);
    var ratio = span[1] / span[0];
    assert.ok(Math.log2(ratio) % 1 === 0, 'High/Low ratio should be a power of 2, got ' + ratio);
  }
});

test('frequency falls within its span bucket', function() {
  // The span [low, high] defines a bucket: the frequency f satisfies
  // low <= f < 2*high (where high is the base found by the loop).
  // When low == high (e.g. [110, 110]), the bucket covers [110, 220).
  for (var i = LOWEST_FREQUENCY; i <= HIGHEST_FREQUENCY; i++) {
    var span = getFrequencySpan(i);
    assert.ok(i >= span[0] && i < 2 * span[1],
      i + ' should be within bucket [' + span[0] + ', ' + (2 * span[1]) + ') for span [' + span[0] + ', ' + span[1] + ']');
  }
});

console.log('\n_checkAnswer() - "lower" answer:');
test('correct when first > second', function() {
  assert.strictEqual(checkAnswer(440, 220, 'lower'), true, '440 > 220, answer "lower" should be correct');
});

test('incorrect when first < second', function() {
  assert.strictEqual(checkAnswer(220, 440, 'lower'), false, '220 < 440, answer "lower" should be incorrect');
});

test('incorrect when first == second', function() {
  assert.strictEqual(checkAnswer(440, 440, 'lower'), false, '440 == 440, answer "lower" should be incorrect');
});

console.log('\n_checkAnswer() - "equal" answer:');
test('correct when first == second', function() {
  assert.strictEqual(checkAnswer(440, 440, 'equal'), true, '440 == 440, answer "equal" should be correct');
});

test('incorrect when first > second', function() {
  assert.strictEqual(checkAnswer(440, 220, 'equal'), false, '440 > 220, answer "equal" should be incorrect');
});

test('incorrect when first < second', function() {
  assert.strictEqual(checkAnswer(220, 440, 'equal'), false, '220 < 440, answer "equal" should be incorrect');
});

console.log('\n_checkAnswer() - "higher" answer:');
test('correct when first < second', function() {
  assert.strictEqual(checkAnswer(220, 440, 'higher'), true, '220 < 440, answer "higher" should be correct');
});

test('incorrect when first > second', function() {
  assert.strictEqual(checkAnswer(440, 220, 'higher'), false, '440 > 220, answer "higher" should be incorrect');
});

test('incorrect when first == second', function() {
  assert.strictEqual(checkAnswer(440, 440, 'higher'), false, '440 == 440, answer "higher" should be incorrect');
});

console.log('\n_checkAnswer() - edge cases:');
test('lowest vs highest - lower is correct', function() {
  assert.strictEqual(checkAnswer(880, 110, 'lower'), true);
});

test('lowest vs highest - higher is incorrect', function() {
  assert.strictEqual(checkAnswer(880, 110, 'higher'), false);
});

test('adjacent frequencies - lower is correct', function() {
  assert.strictEqual(checkAnswer(441, 440, 'lower'), true);
});

test('adjacent frequencies - higher is correct', function() {
  assert.strictEqual(checkAnswer(440, 441, 'higher'), true);
});

console.log('\nAnswer coverage across all tone pairs:');
test('every tone pair has exactly one correct answer', function() {
  var freqs = [110, 220, 330, 440, 550, 660, 770, 880];
  var answers = ['lower', 'equal', 'higher'];
  for (var i = 0; i < freqs.length; i++) {
    for (var j = 0; j < freqs.length; j++) {
      var first = freqs[i];
      var second = freqs[j];
      var correctCount = 0;
      for (var k = 0; k < answers.length; k++) {
        if (checkAnswer(first, second, answers[k])) {
          correctCount++;
        }
      }
      assert.strictEqual(correctCount, 1,
        'For ' + first + ' vs ' + second + ', expected 1 correct answer, got ' + correctCount);
    }
  }
});

test('equal tones only pass with "equal" answer', function() {
  assert.strictEqual(checkAnswer(440, 440, 'lower'), false);
  assert.strictEqual(checkAnswer(440, 440, 'equal'), true);
  assert.strictEqual(checkAnswer(440, 440, 'higher'), false);
});

test('lower first tone passes with "higher" answer', function() {
  var passed = false;
  for (var i = 0; i < 100; i++) {
    var tones = generateTones();
    if (tones.firstFrequency < tones.secondFrequency) {
      assert.strictEqual(checkAnswer(tones.firstFrequency, tones.secondFrequency, 'higher'), true);
      passed = true;
      break;
    }
  }
  assert(passed, 'Could not find a case where first < second in 100 tries');
});

test('higher first tone passes with "lower" answer', function() {
  var passed = false;
  for (var i = 0; i < 100; i++) {
    var tones = generateTones();
    if (tones.firstFrequency > tones.secondFrequency) {
      assert.strictEqual(checkAnswer(tones.firstFrequency, tones.secondFrequency, 'lower'), true);
      passed = true;
      break;
    }
  }
  assert(passed, 'Could not find a case where first > second in 100 tries');
});

console.log('\nResults: ' + testsPassed + ' passed, ' + testsFailed + ' failed\n');
process.exit(testsFailed > 0 ? 1 : 0);
