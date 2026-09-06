# Workflows — Support Lead (Manoj)

Four flows. The first is the one to present; the other three are the ones that get asked about.

A note on what these are for: the agent flow is a task flow — Priya starts, does a thing, finishes. The lead's flows are not like that. Manoj never starts a ticket and rarely finishes one; he intervenes. So these are drawn as the system running continuously with the lead's decision points marked on it, rather than as a person walking through screens.

---

## 1 · Ticket lifecycle, with the lead's intervention points

The spine of the product. Everything in Manoj's tab is one of the diamonds.

```mermaid
flowchart TD
    A["Customer emails support@brightcart.in"] --> B["Platform creates ticket #BC-4821<br/>auto-acknowledgement sent with ticket ID"]
    B --> C{"Assigned within 30 min?"}

    C -->|"Yes — agent claims it"| G["Owner set · SLA clock visible to owner"]
    C -->|"No"| D["Appears in Unassigned Queue<br/>flagged 'over target'"]
    D --> E["Lead notified"]
    E --> F["Lead assigns · sees each agent's live open count"]
    F --> G

    G --> H{"First response within 24h?"}
    H -->|"On track"| I["Agent replies · status → In Progress"]
    H -->|"Under 2h remaining"| J["Breach risk · surfaces on Team Overview<br/>and in lead notifications"]

    J --> K{"Lead acts?"}
    K -->|"Reassign"| F
    K -->|"Raise priority"| I
    K -->|"No action"| L["Breached · logged with reason"]

    I --> M{"Customer replies?"}
    M -->|"Yes"| I
    M -->|"No"| N["Status → Resolved"]
    L --> I
    N --> O["Auto-close after 7 days<br/>reopens as New if customer replies"]
    O --> P["Every event written to the audit trail"]
    P --> Q["Weekly report — no manual assembly"]

    style D fill:#FDE9D9
    style J fill:#FDE9D9
    style L fill:#FADBD8
    style Q fill:#D8EDE3
```

**The three lead intervention points, and the pain each one closes**

| Point | Manoj's own words | What the platform does |
|---|---|---|
| Unassigned over 30 min | *"nobody knows who is handling what"* · *"we shout on floor: anyone on the Sharma refund?"* | Surfaces it with a suggested owner and a live load count |
| Breach risk under 2h | *"urgent ones look same as normal ones. no way to know"* | Ranks by time remaining, not by arrival order |
| Every state change | *"big order issue, management asks who touched this, i have no answer"* | Writes an immutable event with before/after values |

---

## 2 · The Monday report — today, and after

The clearest before-and-after in the whole project, and the one worth showing a client.

```mermaid
flowchart LR
    subgraph TODAY["Today — about 2 hours, every Monday"]
        A1["Open Gmail"] --> A2["Read colour labels"]
        A2 --> A3["Count by hand"]
        A3 --> A4["Type into spreadsheet"]
        A4 --> A5["Guess at what was missed"]
        A5 --> A6["Send to Rohit"]
        A6 --> A7["Out of date by Tuesday"]
    end

    subgraph AFTER["After — minutes, or nothing at all"]
        B1["Report already generated<br/>Monday 08:00"] --> B2["Manoj opens it or reads the email"]
        B2 --> B3{"Something looks wrong?"}
        B3 -->|"Yes"| B4["Click the figure<br/>drills into the filtered ticket list"]
        B3 -->|"No"| B5["Forward to Rohit"]
        B4 --> B5
    end

    style A5 fill:#FADBD8
    style A7 fill:#FADBD8
    style B1 fill:#D8EDE3
```

The design decision worth defending: **every figure on the report is a link into the tickets behind it.** A report that cannot be interrogated becomes a number that gets argued about — which is the state Brightcart is already in, since the current report is a hand-typed count nobody can check.

---

## 3 · Nothing unowned for more than 30 minutes

The first success criterion, drawn as the loop that enforces it.

```mermaid
flowchart TD
    A["Ticket arrives · unowned"] --> B["Clock starts"]
    B --> C{"Claimed by an agent?"}
    C -->|"Yes"| Z["Owned · out of this loop"]
    C -->|"No, and 30 min passed"| D["Row flagged 'over target' in Unassigned<br/>Team Overview tile increments"]
    D --> E["Lead notification: '3 tickets unowned since 09:40'"]
    E --> F["Lead opens Unassigned Queue"]
    F --> G["Suggested owner shown with live open count"]
    G --> H{"Lead agrees?"}
    H -->|"Yes"| I["Assign · single click"]
    H -->|"No"| J["Pick another agent<br/>leave status and load visible"]
    I --> Z
    J --> Z
    Z --> K["Counted in the weekly 'never unowned over 30 min' figure"]

    style D fill:#FDE9D9
    style Z fill:#D8EDE3
```

**Why there is no auto-assign in v1.** The platform has everything it needs to assign automatically, and it deliberately doesn't. Manoj knows that Meera is on a call with a supplier and Faisal is halfway through a chargeback — a load count does not. Auto-assignment before anyone trusts the numbers means the team spends month one undoing the rules. Tagged Should, planned for after a month of real data.

---

## 4 · An agent goes on leave

Short flow, but it is the one Manoj described with a real casualty.

```mermaid
flowchart TD
    A["Lead marks Aditi Joshi on leave · 8–12 Sep"] --> B["Platform lists her 7 open tickets"]
    B --> C["Suggested redistribution across lightest-loaded agents"]
    C --> D{"Lead reviews"}
    D -->|"Accept"| E["Reassign all · one action"]
    D -->|"Adjust"| F["Reassign individually"]
    E --> G["Aditi excluded from suggestions and rules until 12 Sep"]
    F --> G
    G --> H["Coverage recorded in the audit log"]

    style A fill:#D8EDE3
```

Without this screen the failure is not silent — Team Overview shows an agent with untouched tickets ageing within a day. That is why it is a Should, not a Must: the safety net exists, this makes it one action instead of seven.
