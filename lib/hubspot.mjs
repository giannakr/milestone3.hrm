/**
 * HubSpot CRM helpers for Prova recruiting.
 * Token is read only from process.env.HUBSPOT_ACCESS_TOKEN — never from the client.
 */

const HUBSPOT_BASE = "https://api.hubapi.com";

export const SAMPLE_RECRUITING = {
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

function tokenPresent() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  return typeof token === "string" && token.trim().length > 0;
}

function getToken() {
  return (process.env.HUBSPOT_ACCESS_TOKEN || "").trim();
}

async function hubspotFetch(pathname, searchParams) {
  const url = new URL(pathname, HUBSPOT_BASE);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value != null) url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const message =
      (body && (body.message || body.error)) ||
      `HubSpot HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

function contactName(props) {
  const first = (props.firstname || "").trim();
  const last = (props.lastname || "").trim();
  const full = `${first} ${last}`.trim();
  return full || props.email || "Unnamed contact";
}

function isRecruitingContact(props) {
  const haystack = [
    props.hs_lead_status,
    props.lifecyclestage,
    props.jobtitle,
    props.hs_tag_ids,
    props.notes_last_contacted,
    props.prova_recruiting_tag,
    props.recruiting_tag,
    props.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    haystack.includes("sdr") ||
    haystack.includes("hiring") ||
    haystack.includes("recruit") ||
    haystack.includes("candidate") ||
    Boolean(props.prova_recruiting_tag) ||
    Boolean(props.recruiting_tag)
  );
}

function stageLabel(stage) {
  const map = {
    appointmentscheduled: "Phone screen",
    qualifiedtobuy: "Written exercise",
    presentationscheduled: "Mock demo",
    decisionmakerboughtin: "Structured interview",
    contractsent: "Offer",
    closedwon: "Hired",
    closedlost: "Passed",
  };
  return map[stage] || stage || "Unknown";
}

export async function checkConnection() {
  if (!tokenPresent()) {
    return {
      ok: true,
      connected: false,
      mode: "mock",
      tokenPresent: false,
      message:
        "HUBSPOT_ACCESS_TOKEN is not set. Showing labeled sample data until Prova connects HubSpot in Cursor Secrets.",
      account: SAMPLE_RECRUITING.account,
    };
  }

  try {
    // Prefer account-info (no token in the path). Falls back to a contacts ping.
    let account = {
      portalId: null,
      hubDomain: null,
      user: null,
      scopes: [],
    };
    try {
      const info = await hubspotFetch("/account-info/v3/details");
      account = {
        portalId:
          info.portalId != null
            ? String(info.portalId)
            : info.portal_id != null
              ? String(info.portal_id)
              : null,
        hubDomain: info.uiDomain || info.timeZone || null,
        timeZone: info.timeZone || null,
        companyCurrency: info.companyCurrency || null,
        user: null,
        scopes: [],
      };
    } catch {
      await hubspotFetch("/crm/v3/objects/contacts", {
        limit: 1,
        properties: "email",
      });
    }
    return {
      ok: true,
      connected: true,
      mode: "live",
      tokenPresent: true,
      message: "Connected to HubSpot.",
      account,
    };
  } catch (err) {
    return {
      ok: false,
      connected: false,
      mode: "mock",
      tokenPresent: true,
      message: `HubSpot token present but API check failed: ${err.message}`,
      error: err.message,
      account: SAMPLE_RECRUITING.account,
    };
  }
}

export async function getRecruitingData() {
  if (!tokenPresent()) {
    return { ...SAMPLE_RECRUITING, generatedAt: new Date().toISOString() };
  }

  try {
    const contactsRes = await hubspotFetch("/crm/v3/objects/contacts", {
      limit: 50,
      properties: [
        "firstname",
        "lastname",
        "email",
        "phone",
        "lifecyclestage",
        "jobtitle",
        "hs_lead_status",
        "notes_last_contacted",
        "prova_recruiting_tag",
        "recruiting_tag",
        "hs_lastmodifieddate",
      ].join(","),
      associations: "deals",
    });

    let dealsRes = { results: [] };
    try {
      dealsRes = await hubspotFetch("/crm/v3/objects/deals", {
        limit: 50,
        properties: "dealname,dealstage,amount,closedate,pipeline",
      });
    } catch {
      dealsRes = { results: [] };
    }

    const rawContacts = Array.isArray(contactsRes.results)
      ? contactsRes.results
      : [];
    const mapped = rawContacts.map((c) => {
      const props = c.properties || {};
      const recruiting = isRecruitingContact(props);
      return {
        id: String(c.id),
        name: contactName(props),
        email: props.email || "",
        phone: props.phone || "",
        lifecycleStage: props.lifecyclestage || "",
        recruitingTag:
          props.prova_recruiting_tag ||
          props.recruiting_tag ||
          (recruiting ? "SDR hiring" : ""),
        pipelineStage: props.hs_lead_status || props.lifecyclestage || "",
        notes: props.notes_last_contacted || props.jobtitle || "",
        lastModified: props.hs_lastmodifieddate || c.updatedAt || null,
        _recruiting: recruiting,
      };
    });

    const recruitingContacts = mapped.filter((c) => c._recruiting);
    const contacts =
      recruitingContacts.length > 0
        ? recruitingContacts.map(({ _recruiting, ...rest }) => rest)
        : mapped.slice(0, 12).map(({ _recruiting, ...rest }) => rest);

    const deals = (Array.isArray(dealsRes.results) ? dealsRes.results : [])
      .map((d) => {
        const props = d.properties || {};
        return {
          id: String(d.id),
          name: props.dealname || "Untitled deal",
          stage: props.dealstage || "",
          stageLabel: stageLabel(props.dealstage),
          amount: props.amount != null && props.amount !== "" ? props.amount : null,
          associatedContact: null,
        };
      })
      .slice(0, 20);

    const status = await checkConnection();

    return {
      mode: "live",
      label: "Live HubSpot",
      account: status.account || null,
      contacts,
      deals,
      generatedAt: new Date().toISOString(),
      note:
        recruitingContacts.length === 0
          ? "No contacts matched SDR/hiring tags — showing recent contacts. Tag candidates with “SDR hiring” (or custom property prova_recruiting_tag) to filter."
          : undefined,
    };
  } catch (err) {
    return {
      ...SAMPLE_RECRUITING,
      mode: "mock",
      label: "Sample data (HubSpot error)",
      error: err.message || "HubSpot request failed",
      generatedAt: new Date().toISOString(),
    };
  }
}
