var scrollPercentage = 0;
var listeners = [];

function calculateScrollPercentage() {
  var windowHeight = window.innerHeight;
  var documentHeight = document.documentElement.scrollHeight;
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  var scrollableHeight = documentHeight - windowHeight;

  if (scrollableHeight <= 0) {
    return 0;
  }

  var percentage = (scrollTop / scrollableHeight) * 100;
  return Math.round(percentage);
}

function setScrollPercentage(value) {
  scrollPercentage = value;
  listeners.forEach(function notifyListener(listener) {
    listener(scrollPercentage);
  });
}

function getScrollPercentage() {
  return scrollPercentage;
}

function subscribe(listener) {
  listeners.push(listener);
  return function unsubscribe() {
    var index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

function updateScrollPercentage() {
  var newPercentage = calculateScrollPercentage();
  setScrollPercentage(newPercentage);
}

export {
  getScrollPercentage,
  subscribe,
  updateScrollPercentage,
  calculateScrollPercentage,
};
