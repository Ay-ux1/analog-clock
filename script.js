/* ---------- SETTINGS ---------- */
// false = second hand jumps once per second (like the Figma pose, ticking clock)
// true  = second hand sweeps smoothly
const SMOOTH_SECOND_HAND = false;
 
(function () {
  'use strict';
 
  /* ---------- ELEMENTS ---------- */
  const clock      = document.getElementById('clock');
  const ticksEl    = document.getElementById('ticks');
  const numbersEl  = document.getElementById('numbers');
 
  /* ---------- BUILD THE FACE ---------- */
 
  // 60 ticks, each rotated 6 degrees. Every 5th one is the long hour tick.
  const tickFragment = document.createDocumentFragment();
  for (let i = 0; i < 60; i++) {
    const tick = document.createElement('div');
    tick.className = 'tick' + (i % 5 === 0 ? ' tick--hour' : '');
    tick.style.setProperty('--angle', (i * 6) + 'deg');
    tickFragment.appendChild(tick);
  }
  ticksEl.appendChild(tickFragment);
 
  // Numbers 1-12. CSS places each one on the number circle at n * 30 degrees
  // and keeps the text upright.
  const numberFragment = document.createDocumentFragment();
  for (let n = 1; n <= 12; n++) {
    const num = document.createElement('div');
    num.className = 'number';
    num.textContent = n;
    num.style.setProperty('--angle', (n * 30) + 'deg');
    numberFragment.appendChild(num);
  }
  numbersEl.appendChild(numberFragment);
 
  /* ---------- HANDS ---------- */
 
  // "turns" counts full rotations so an angle never drops back from 359 to 0.
  // That is what prevents the hand from spinning backward at 12.
  const hands = {
    hour:   { el: document.getElementById('hour-hand'),   turns: 0, last: 0 },
    minute: { el: document.getElementById('minute-hand'), turns: 0, last: 0 },
    second: { el: document.getElementById('second-hand'), turns: 0, last: 0 }
  };
 
  function setHand(hand, rawAngle) {
    let angle = rawAngle + hand.turns * 360;
    if (angle < hand.last - 180) {   // wrapped past 12: keep going forward
      hand.turns += 1;
      angle += 360;
    }
    hand.last = angle;
    hand.el.style.setProperty('--angle', angle + 'deg');
  }
 
  /* ---------- RENDER ---------- */
  let lastMinuteLabel = '';
 
  function render(now) {
    const hours   = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
 
    // Angles exactly as specified:
    //   second = seconds x 6
    //   minute = minutes x 6 + seconds x 0.1
    //   hour   = (hours % 12) x 30 + minutes x 0.5
    const secondAngle = (SMOOTH_SECOND_HAND
      ? seconds + now.getMilliseconds() / 1000
      : seconds) * 6;
    const minuteAngle = minutes * 6 + seconds * 0.1;
    const hourAngle   = (hours % 12) * 30 + minutes * 0.5;
 
    setHand(hands.hour,   hourAngle);
    setHand(hands.minute, minuteAngle);
    setHand(hands.second, secondAngle);
 
    // Keep a readable time for screen readers (updates once a minute)
    const label = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (label !== lastMinuteLabel) {
      lastMinuteLabel = label;
      clock.setAttribute('aria-label', 'Analog clock, ' + label);
    }
  }
 
  /* ---------- LOOP ---------- */
  // requestAnimationFrame stays in sync with the real time even after the
  // tab was in the background (setInterval can drift).
  let lastWholeSecond = -1;
 
  function frame() {
    const now = new Date();
    const wholeSecond = Math.floor(now.getTime() / 1000);
 
    if (SMOOTH_SECOND_HAND || wholeSecond !== lastWholeSecond) {
      lastWholeSecond = wholeSecond;
      render(now);
    }
    requestAnimationFrame(frame);
  }
 
  if (!SMOOTH_SECOND_HAND) clock.classList.add('clock--stepped');
 
  render(new Date());   // draw the correct time before the first paint
  // Turn on the second-hand ease only after the first paint (no sweep on load)
  requestAnimationFrame(function () {
    clock.classList.add('is-ready');
    requestAnimationFrame(frame);
  });
})();