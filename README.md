# Sales Pipeline Prototype

A frontend-only, single-page prototype of the real-estate CRM **Sales** area, built in the existing CRM's
visual language (dark sidebar, white header and filter bar, gray Kanban columns, white cards).
It shows the redesigned workflow to stakeholders before it is built into the production CRM.

No backend, build step or install is needed. Open `index.html` in a browser.
`index.html#cold` opens the Cold view directly.

```
index.html   CRM shell: sidebar, header, Fresh / Cold tabs, filter bar
styles.css   visual language (sidebar, tables, Kanban, cards, badges, modal)
app.js       configuration, demo data, state, rendering, modals, filters, drag & drop
```

## Navigation

```
Leads
 ├── Fresh   new incoming leads            → List view only
 └── Cold    leads being worked by Sales   → List view + Kanban
```

### Fresh

- **+ Add Lead** opens one large centered modal with: Name, Number, Sales Pipeline, Status, Budget,
  Lead Creation Date, Project, Sales Name, Unit, Manager, Created By, Channel, Platform, Feedback / Notes.
- New leads start as Stage **Fresh Leads**, Status **Fresh Lead**, no sub-status, and appear in Fresh only.
- **Channel** is Direct or Indirect. **Platform** options change with the channel.
- Clicking a row opens the same modal to edit the intake data.
- **Move to Cold** (row action or modal button) sends the lead into the Cold pipeline's Fresh Leads stage.
  A Sales Name is required first.

### Cold

- Kanban with exactly 5 stages: Fresh Leads, Contact & Follow-Up, Lead Qualification, Meeting Management, Deal / Closing.
- Cold › Fresh Leads only holds leads moved over from the Fresh view.
- Clicking a card (or a list row) opens one centered modal: Stage → Status → Sub-status → Related Details.
- Dragging a card to another stage opens the same modal with that stage preselected. The lead only moves on save.

## Configuration

Everything is data-driven from the top of `app.js`:

| Object          | Purpose                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `STAGES`        | The 5 Cold pipeline stages (Kanban columns)                                   |
| `STATUS_CONFIG` | Statuses per stage, their sub-statuses, and the related fields each one shows |
| `FIELD_DEFS`    | Related data fields (Budget, Project, Office, Site, EOI, Unit Type, …)        |
| `CHANNELS`      | Channel → Platform options                                                    |
| `DEMO_LEADS`    | Demo records (`pool: 'fresh'` or Cold by default)                             |

## Demo scenarios (Cold)

| Lead | Stage | Status › Sub-status |
| --- | --- | --- |
| Karim Adel | Fresh Leads | Fresh Lead |
| Laila Mostafa | Contact & Follow-Up | No Answer › Location |
| Ahmed Mohamed | Lead Qualification | Qualified › Budget |
| Ahmed Hassan | Meeting Management | Schedule Meeting › Office |
| Sara Mohamed | Meeting Management | Meeting Done › Budget |
| Omar Khaled | Meeting Management | Reschedule Meeting › Site |
| Mahmoud Galal | Deal / Closing | Deal › Reservation |

State lives in memory only, so reloading the page resets the demo data.
