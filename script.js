// ---------- Page elements ----------
const barsEl = document.getElementById('bars');
const algoEl = document.getElementById('algo');
const sizeEl = document.getElementById('size');
const speedEl = document.getElementById('speed');
const sizeOut = document.getElementById('sizeOut');
const speedOut = document.getElementById('speedOut');
const newBtn = document.getElementById('newBtn');
const sortBtn = document.getElementById('sortBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const cmpEl = document.getElementById('cmpCount');
const moveEl = document.getElementById('moveCount');

// ---------- State ----------
let arr = [];          // the numbers being sorted
let bars = [];         // one <div> per number
let sorted = [];       // sorted[i] is true when bar i is in its final place
let comparisons = 0;
let moves = 0;
let running = false;
let cancelled = false;

// ---------- Info shown under the bars ----------
const INFO = {
  bubble: {
    name: 'Bubble sort',
    idea: 'Compare neighbours and swap them if they are in the wrong order. After each pass the largest remaining bar "bubbles" to the end.',
    time: 'Best O(n) · Average O(n²) · Worst O(n²) · Space O(1)'
  },
  selection: {
    name: 'Selection sort',
    idea: 'Find the smallest bar in the unsorted part and swap it to the front. Repeat for the next position.',
    time: 'Best O(n²) · Average O(n²) · Worst O(n²) · Space O(1)'
  },
  insertion: {
    name: 'Insertion sort',
    idea: 'Take the next bar and slide it left until it sits in the right place among the bars before it, like sorting playing cards in your hand.',
    time: 'Best O(n) · Average O(n²) · Worst O(n²) · Space O(1)'
  },
  merge: {
    name: 'Merge sort',
    idea: 'Split the array in half again and again, then merge the sorted halves back together by always taking the smaller front element.',
    time: 'Best O(n log n) · Average O(n log n) · Worst O(n log n) · Space O(n)'
  },
  quick: {
    name: 'Quick sort',
    idea: 'Pick a pivot, move smaller bars to its left and larger bars to its right, then sort each side the same way.',
    time: 'Best O(n log n) · Average O(n log n) · Worst O(n²) · Space O(log n)'
  }
};

function showInfo() {
  const info = INFO[algoEl.value];
  document.getElementById('infoName').textContent = info.name;
  document.getElementById('infoIdea').textContent = info.idea;
  document.getElementById('infoTime').textContent = info.time;
}

// ---------- Drawing ----------
function newArray() {
  const n = Number(sizeEl.value);
  arr = Array.from({ length: n }, () => 10 + Math.floor(Math.random() * 90));
  sorted = new Array(n).fill(false);
  barsEl.innerHTML = '';
  bars = arr.map(() => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    barsEl.appendChild(bar);
    return bar;
  });
  barsEl.classList.toggle('show-values', n <= 25);
  arr.forEach((_, i) => setHeight(i));
  resetStats();
  setStatus('Pick an algorithm and press Start sorting.');
}

function setHeight(i) {
  bars[i].style.height = arr[i] + '%';
  bars[i].dataset.v = arr[i];
}

// entries looks like [[3, 'compare'], [4, 'compare']]
function paint(entries = []) {
  bars.forEach((bar, i) => {
    bar.className = 'bar' + (sorted[i] ? ' sorted' : '');
  });
  entries.forEach(([i, cls]) => bars[i].classList.add(cls));
}

function resetStats() {
  comparisons = 0;
  moves = 0;
  updateStats();
}

function updateStats() {
  cmpEl.textContent = comparisons;
  moveEl.textContent = moves;
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ---------- Timing ----------
function delay() {
  const speed = Number(speedEl.value);      // 1 (slow) to 10 (fast)
  return Math.round(500 / Math.pow(speed, 1.5));
}

async function tick() {
  if (cancelled) throw new Error('stopped');
  await new Promise(resolve => setTimeout(resolve, delay()));
  if (cancelled) throw new Error('stopped');
}

// ---------- Building blocks every algorithm uses ----------

// Is arr[i] bigger than arr[j]?
async function greater(i, j, extra = []) {
  comparisons++;
  updateStats();
  paint([[i, 'compare'], [j, 'compare'], ...extra]);
  await tick();
  return arr[i] > arr[j];
}

// Swap two bars
async function swap(i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
  moves++;
  updateStats();
  setHeight(i);
  setHeight(j);
  paint([[i, 'swap'], [j, 'swap']]);
  await tick();
}

// Write one value into position i (used by merge sort)
async function write(i, value) {
  arr[i] = value;
  moves++;
  updateStats();
  setHeight(i);
  paint([[i, 'swap']]);
  await tick();
}

// ---------- The algorithms ----------

async function bubbleSort() {
  const n = arr.length;
  for (let end = n - 1; end > 0; end--) {
    let swapped = false;
    for (let j = 0; j < end; j++) {
      if (await greater(j, j + 1)) {
        await swap(j, j + 1);
        swapped = true;
      }
    }
    sorted[end] = true;
    if (!swapped) break;           // already in order, stop early
  }
  sorted.fill(true);
}

async function selectionSort() {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      if (await greater(min, j, [[min, 'pivot']])) min = j;
    }
    if (min !== i) await swap(i, min);
    sorted[i] = true;
  }
  sorted.fill(true);
}

async function insertionSort() {
  const n = arr.length;
  sorted[0] = false;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0 && await greater(j - 1, j)) {
      await swap(j - 1, j);
      j--;
    }
  }
  sorted.fill(true);
}

async function mergeSort(left = 0, right = arr.length - 1) {
  if (left >= right) return;
  const mid = Math.floor((left + right) / 2);
  await mergeSort(left, mid);
  await mergeSort(mid + 1, right);

  // merge the two sorted halves
  const a = arr.slice(left, mid + 1);
  const b = arr.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;
  while (i < a.length && j < b.length) {
    comparisons++;
    updateStats();
    paint([[left + i, 'compare'], [mid + 1 + j, 'compare']]);
    await tick();
    if (a[i] <= b[j]) await write(k++, a[i++]);
    else await write(k++, b[j++]);
  }
  while (i < a.length) await write(k++, a[i++]);
  while (j < b.length) await write(k++, b[j++]);
}

async function quickSort(low = 0, high = arr.length - 1) {
  if (low > high) return;
  if (low === high) { sorted[low] = true; return; }

  const pivotIndex = high;         // use the last element as the pivot
  let i = low;                     // i = next spot for a "small" bar
  for (let j = low; j < high; j++) {
    if (await greater(pivotIndex, j, [[pivotIndex, 'pivot']])) {
      if (i !== j) await swap(i, j);
      i++;
    }
  }
  if (i !== pivotIndex) await swap(i, pivotIndex);
  sorted[i] = true;                // the pivot is now in its final place

  await quickSort(low, i - 1);
  await quickSort(i + 1, high);
}

const ALGORITHMS = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort
};

// ---------- Buttons ----------
function setRunning(isRunning) {
  running = isRunning;
  sortBtn.disabled = isRunning;
  newBtn.disabled = isRunning;
  algoEl.disabled = isRunning;
  sizeEl.disabled = isRunning;
  stopBtn.disabled = !isRunning;
}

async function startSorting() {
  if (running) return;
  sorted.fill(false);
  paint();
  resetStats();
  cancelled = false;
  setRunning(true);
  setStatus('Sorting with ' + INFO[algoEl.value].name.toLowerCase() + '...');

  try {
    await ALGORITHMS[algoEl.value]();
    sorted.fill(true);
    paint();
    setStatus('Done. ' + comparisons + ' comparisons and ' + moves + ' swaps or writes.');
  } catch (err) {
    if (err.message !== 'stopped') throw err;
    paint();
    setStatus('Stopped. Press New array to start again.');
  } finally {
    setRunning(false);
  }
}

sortBtn.addEventListener('click', startSorting);
stopBtn.addEventListener('click', () => { cancelled = true; });
newBtn.addEventListener('click', newArray);
algoEl.addEventListener('change', showInfo);

sizeEl.addEventListener('input', () => {
  sizeOut.textContent = sizeEl.value;
  if (!running) newArray();
});
speedEl.addEventListener('input', () => {
  speedOut.textContent = speedEl.value;
});

// ---------- Start ----------
showInfo();
newArray();