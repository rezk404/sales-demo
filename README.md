# Sales Pipeline Prototype

A frontend-only, single-page prototype of the real-estate CRM **Sales Pipeline** workspace.
It shows the redesigned workflow to stakeholders before it is built into the production CRM.

No backend, build step or install is needed. Open `index.html` in a browser.

```
index.html   page structure
styles.css   visual language (light CRM style, cards, badges, modal)
app.js       configuration, demo data, state, rendering, modal, filters, drag & drop
```

## Workflow

```
STAGE (Kanban column) → LEAD (card) → STATUS → SUB-STATUS → RELATED DATA → SAVE
```

- **5 stages** are the columns: Fresh Leads, Contact & Follow-Up, Lead Qualification, Meeting Management, Deal / Closing.
- **Status and sub-status** belong to the lead and show as badges on the card, for example `[Qualified] › [Budget]`.
- **Clicking a card** opens one centered modal. Stage → Status → Sub-status → Related details all update in place.
- **Dragging a card** to another column opens the same modal with the target stage preselected. The lead only moves when you save. Cancel leaves it where it was.
- **Save** updates the card, its badges, the stage counts and the activity log without a reload.

## Configuration

Everything is data-driven from the top of `app.js`:

| Object         | Purpose                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| `STAGES`       | The 5 pipeline stages (columns)                                                  |
| `STATUS_CONFIG`| Statuses per stage, their sub-statuses, and the related fields each one shows    |
| `FIELD_DEFS`   | Related data fields (Budget, Project, Office, Site, EOI, Unit Type, …)           |
| `DEMO_LEADS`   | Demo records                                                                     |

Each sub-status points at the related field it is about (`field`). The modal highlights that field when the sub-status is selected.

## Demo scenarios

| Scenario | Lead | Stage | Status › Sub-status |
| --- | --- | --- | --- |
| A | Karim Adel | Fresh Leads | Fresh Lead |
| B | Laila Mostafa | Contact & Follow-Up | No Answer › Location |
| C | Ahmed Mohamed | Lead Qualification | Qualified › Budget |
| D | Ahmed Hassan | Meeting Management | Schedule Meeting › Office |
| E | Sara Mohamed | Meeting Management | Meeting Done › Budget |
| F | Omar Khaled | Meeting Management | Reschedule Meeting › Site |
| G | Mahmoud Galal | Deal / Closing | Deal › Reservation |

State lives in memory only, so reloading the page resets the demo data.
