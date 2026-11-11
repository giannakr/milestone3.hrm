(function () {
  "use strict";

  var PASSWORD = "TAER26";

  var gate = document.getElementById("gate");
  var site = document.getElementById("site");
  var form = document.getElementById("gate-form");
  var input = document.getElementById("gate-password");
  var error = document.getElementById("gate-error");
  var applyBtn = document.getElementById("apply-btn");
  var applySoon = document.getElementById("apply-soon");

  function unlock() {
    if (!gate || !site) return;
    gate.hidden = true;
    site.hidden = false;
    document.body.style.overflow = "";
  }

  function showGate() {
    if (!gate || !site) return;
    gate.hidden = false;
    site.hidden = true;
    document.body.style.overflow = "hidden";
    if (input) {
      input.value = "";
      window.setTimeout(function () {
        input.focus();
      }, 50);
    }
  }

  // Always require password on open/refresh — no sessionStorage/localStorage unlock.
  showGate();

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = (input && input.value ? input.value : "").trim();
      if (value === PASSWORD) {
        if (error) error.hidden = true;
        unlock();
        return;
      }
      if (error) error.hidden = false;
      if (input) {
        input.select();
        input.focus();
      }
    });
  }

  if (applyBtn && applySoon) {
    applyBtn.addEventListener("click", function () {
      applySoon.hidden = false;
      applyBtn.setAttribute("aria-expanded", "true");
    });
  }
})();
