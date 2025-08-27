const scrollToLastPosition = (function () {

  function getScrollPositionProp() {
    const [orientation = "landscape"] = screen.orientation?.type.split('-');
    return `${orientation}Scroll`;
  }

  return () => {
    // get saved scroll position
    const targetPosition = localStorage[getScrollPositionProp()] ?? "0";
    // set scroll position
    window.scrollTo(window.scrollX, parseInt(targetPosition, 10));
    // save updated position after scroll events
    window.addEventListener("scroll", () => {
      localStorage[getScrollPositionProp()] = window.scrollY;
    });
    screen.orientation.addEventListener("change", () => {
      localStorage[getScrollPositionProp()] = window.scrollY;
    });
  };
}());

function toggle(li, value) {
  li.querySelector('input').checked = value;
}

function loadState() {
  const checkboxes = document.body.querySelectorAll('input[type=checkbox]');
  localStorage.tog?.split(',').forEach((value, index) => {
    checkboxes.item(index).checked = !!value;
  });
}

function saveState() {
  const checkboxes = document.body.querySelectorAll('input[type=checkbox]');
  localStorage.tog = Array.from(checkboxes).map((el) => el.checked ? '1' : '');
}

document.querySelector('.chapter-list').addEventListener('change', (e) => {
  let i = e.target;
  do {
    i = i.parentNode;
  } while (i?.tagName !== 'LI');
  const targetClassName = i.className;

  // if we're checking, check all previous chapters in the book
  if (e.target.checked) {    
    while (i.previousElementSibling) {
      if (i.previousElementSibling?.className == targetClassName) {
        toggle(i.previousElementSibling, true);
      }
      i = i.previousElementSibling;
    }
  }
  else {
    while (i.nextElementSibling) {
      if (i.nextElementSibling.className == targetClassName) {
        toggle(i.nextElementSibling, false);
      }
      i = i.nextElementSibling;
    }
  }

  // sync state
  saveState();
});

document.querySelector('.book-list').addEventListener('change', () => saveState());

// save after load in case we change the serialization
loadState();
saveState();
scrollToLastPosition();
navigator?.serviceWorker.register('./offline.js')
  .then((registration) => {
    console.log('Service Worker Registered', registration);
  }, (error) => {
    console.log('Service Worker Registration failed', error);
  });
