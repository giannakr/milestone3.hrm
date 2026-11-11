(function () {
  "use strict";

  var statusEl = document.getElementById("hs-status");
  var accountEl = document.getElementById("hs-account");
  var modeBadge = document.getElementById("hs-mode-badge");
  var contactsEl = document.getElementById("hs-contacts");
  var dealsEl = document.getElementById("hs-deals");
  var noteEl = document.getElementById("hs-note");
  var refreshBtn = document.getElementById("hs-refresh");

  var SAMPLE = {
    mode: "mock",
    label: "Sample data",
    account: {
      portalId: "00000000",
      name: "Prova (sample)",
      timeZone: "America/Denver",
    },
    contacts: [
      {
        id: "sample-1",
        name: "Jordan Lee",
        email: "jordan.lee@example.edu",
        phone: "+1 (801) 555-0142",
        lifecycleStage: "lead",
        recruitingTag: "SDR hiring",
        pipelineStage: "Phone screen",
        notes: "Strong education background; relocating to Lehi in May.",
        lastModified: "2026-03-01T16:20:00.000Z",
      },
      {
        id: "sample-2",
        name: "Sam Rivera",
        email: "sam.rivera@example.com",
        phone: "+1 (385) 555-0198",
        lifecycleStage: "marketingqualifiedlead",
        recruitingTag: "SDR hiring",
        pipelineStage: "Written exercise",
        notes: "Former classroom teacher; sharp written outreach sample.",
        lastModified: "2026-03-04T11:05:00.000Z",
      },
      {
        id: "sample-3",
        name: "Casey Nguyen",
        email: "casey.nguyen@example.com",
        phone: "",
        lifecycleStage: "lead",
        recruitingTag: "SDR hiring",
        pipelineStage: "Resume screen",
        notes: "New grad; interested in founder mentorship.",
        lastModified: "2026-03-06T09:40:00.000Z",
      },
    ],
    deals: [
      {
        id: "sample-deal-1",
        name: "SDR — Jordan Lee",
        stage: "appointmentscheduled",
        stageLabel: "Phone screen",
        amount: null,
        associatedContact: "Jordan Lee",
      },
      {
        id: "sample-deal-2",
        name: "SDR — Sam Rivera",
        stage: "qualifiedtobuy",
        stageLabel: "Written exercise",
        amount: null,
        associatedContact: "Sam Rivera",
      },
    ],
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setBadge(mode, label) {
    if (!modeBadge) return;
    modeBadge.hidden = false;
    modeBadge.textContent = label || (mode === "live" ? "Live HubSpot" : "Sample data");
    modeBadge.classList.toggle("hs-badge--live", mode === "live");
    modeBadge.classList.toggle("hs-badge--mock", mode !== "live");
  }

  function renderStatus(status, apiAvailable) {
    if (!statusEl) return;
    var connected = Boolean(status && status.connected);
    var tokenPresent = Boolean(status && status.tokenPresent);
    var lines = [];

    if (!apiAvailable) {
      lines.push(
        "API host unavailable (likely GitHub Pages). Client is showing labeled sample data. Use the Cursor-published app for a live HubSpot connection."
      );
    } else if (connected) {
      lines.push(status.message || "Connected to HubSpot.");
    } else if (tokenPresent) {
      lines.push(status.message || "Token present but HubSpot did not respond.");
    } else {
      lines.push(
        status && status.message
          ? status.message
          : "No HUBSPOT_ACCESS_TOKEN on the server yet — sample recruiting data is shown."
      );
    }

    statusEl.innerHTML =
      '<p class="hs-status__line">' +
      esc(lines[0]) +
      "</p>" +
      '<dl class="hs-status__meta">' +
      "<div><dt>Token on server</dt><dd>" +
      (apiAvailable ? (tokenPresent ? "Present" : "Not set") : "n/a (static host)") +
      "</dd></div>" +
      "<div><dt>Connection</dt><dd>" +
      (apiAvailable ? (connected ? "Connected" : "Not connected") : "Mock only") +
      "</dd></div>" +
      "</dl>";

    if (accountEl) {
      var account = (status && status.account) || SAMPLE.account;
      accountEl.innerHTML =
        "<div><dt>Portal / account</dt><dd>" +
        esc(account.portalId || account.name || "—") +
        "</dd></div>" +
        "<div><dt>Domain / timezone</dt><dd>" +
        esc(account.hubDomain || account.timeZone || "—") +
        "</dd></div>";
    }
  }

  function renderContacts(contacts) {
    if (!contactsEl) return;
    if (!contacts || !contacts.length) {
      contactsEl.innerHTML = '<p class="hs-empty">No recruiting contacts yet.</p>';
      return;
    }
    contactsEl.innerHTML = contacts
      .map(function (c) {
        return (
          '<article class="hs-row">' +
          '<div class="hs-row__main">' +
          "<h3>" +
          esc(c.name) +
          "</h3>" +
          '<p class="hs-row__meta">' +
          esc(c.email || "No email") +
          (c.phone ? " · " + esc(c.phone) : "") +
          "</p>" +
          (c.notes ? '<p class="hs-row__notes">' + esc(c.notes) + "</p>" : "") +
          "</div>" +
          '<div class="hs-row__side">' +
          (c.recruitingTag
            ? '<span class="hs-tag">' + esc(c.recruitingTag) + "</span>"
            : "") +
          '<span class="hs-stage">' +
          esc(c.pipelineStage || c.lifecycleStage || "—") +
          "</span>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderDeals(deals) {
    if (!dealsEl) return;
    if (!deals || !deals.length) {
      dealsEl.innerHTML = '<p class="hs-empty">No recruiting pipeline deals yet.</p>';
      return;
    }
    dealsEl.innerHTML = deals
      .map(function (d) {
        return (
          '<article class="hs-row hs-row--compact">' +
          '<div class="hs-row__main">' +
          "<h3>" +
          esc(d.name) +
          "</h3>" +
          (d.associatedContact
            ? '<p class="hs-row__meta">' + esc(d.associatedContact) + "</p>"
            : "") +
          "</div>" +
          '<div class="hs-row__side">' +
          '<span class="hs-stage">' +
          esc(d.stageLabel || d.stage || "—") +
          "</span>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function applyRecruiting(data, apiAvailable) {
    setBadge(data.mode, data.label);
    renderContacts(data.contacts);
    renderDeals(data.deals);
    if (noteEl) {
      if (data.note || data.error || !apiAvailable) {
        noteEl.hidden = false;
        noteEl.textContent =
          data.note ||
          data.error ||
          "GitHub Pages serves static files only — this view is sample data until you open the Cursor-hosted app with HUBSPOT_ACCESS_TOKEN set.";
      } else {
        noteEl.hidden = true;
        noteEl.textContent = "";
      }
    }
  }

  async function load() {
    if (refreshBtn) refreshBtn.disabled = true;
    var apiAvailable = false;
    var status = {
      connected: false,
      tokenPresent: false,
      mode: "mock",
      message: "Using sample data.",
      account: SAMPLE.account,
    };
    var recruiting = SAMPLE;

    try {
      var statusRes = await fetch("/api/hubspot/status", { headers: { Accept: "application/json" } });
      if (statusRes.ok) {
        apiAvailable = true;
        status = await statusRes.json();
      }
    } catch (e) {
      apiAvailable = false;
    }

    if (apiAvailable) {
      try {
        var recRes = await fetch("/api/hubspot/recruiting", {
          headers: { Accept: "application/json" },
        });
        if (recRes.ok) {
          recruiting = await recRes.json();
        }
      } catch (e2) {
        recruiting = SAMPLE;
      }
    }

    renderStatus(status, apiAvailable);
    applyRecruiting(recruiting, apiAvailable);
    if (refreshBtn) refreshBtn.disabled = false;
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      load();
    });
  }

  load();
})();
