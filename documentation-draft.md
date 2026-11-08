# Car Rental Tracker — Written Documentation (DRAFT)

> Mga `[brackets]` kay kinahanglan pun-an sa members. Ayaw i-submit ang file nga kini; kopyaha sa Word/Docs ug i-export as PDF: `GroupName_PrelimProject.pdf`.

## Cover page
| | |
|---|---|
| Project title | Car Rental Tracker |
| Group name | [Group name] |
| Members | Leandro Alexis Lolo — [role]; Kinlee Dionio — [role]; Angel James Abelgas — [role] ([mark leader]) |
| Course and section | ITPFE 1 — Web Systems and Technologies 2, [Section] |
| Instructor | [Instructor name] |
| Date submitted | [Date] |
| Repository | https://github.com/jamesabelgas70-creator/Car-Rental-Tracker |
| Live app | https://jamesabelgas70-creator.github.io/Car-Rental-Tracker/ |
| Video | [Video link] |

## 1. Project overview
**Problem:** [Small car rental owners often track cars, renters and bookings on paper or chat, so double-bookings and wrong totals happen. Confirm/edit in your own words.]

**Users:** Staff of a small car rental business who check which cars are free and record renters.

**Solution:** A single-page app where staff add cars, check availability for a date range, record renters with a live fee preview, and see summary cards (earnings, cars out, fleet utilization, upcoming). Data is saved in localStorage.

## 2. Features
| Feature | What the user can do | Owner |
|---|---|---|
| Car management | Add, edit, delete cars with photo upload; view details | [Member] |
| Availability check | Pick dates or quick ranges (2/7/14 days); cars show Available/Booked | [Member] |
| Renters | Add, edit, delete renters with validation and live fee preview | [Member] |
| Summary | Earnings, cars out, fleet utilization, upcoming rentals | [Member] |

## 3. Architecture
### 3.1 Folder structure
```
Car-Rental-Tracker/
├── index.html
├── css/style.css
├── images/cars/placeholder.jpg
└── js/
    ├── model.js
    ├── controller.js
    ├── data/catalog.js
    ├── helpers/format.js
    └── views/
        ├── View.js
        ├── CarListView.js
        ├── CarDetailsView.js
        ├── CarFormView.js
        ├── DateFilterView.js
        ├── RenterFormView.js
        ├── RentersListView.js
        └── SummaryView.js
```

### 3.2 State object (`model.js`)
```js
export const state = {
  cars: [],      // [{ id, name, type, plate, dailyRate, image }]
  renters: [],   // [{ id, name, contact, carId, startDate, endDate, days, dailyRate, fee }]
  seeded: false, // true once catalog cars were added, so deleted ones never come back
};
```
Sample: `cars: [{ id: 1731000000000, name: "Toyota Vios", type: "Sedan", plate: "ABC 1234", dailyRate: 1500, image: "images/cars/vios.jpg" }]`, `renters: [{ id: 1731000000001, name: "Juan Dela Cruz", contact: "09171234567", carId: 1731000000000, startDate: "2026-11-10", endDate: "2026-11-13", days: 4, dailyRate: 1500, fee: 6000 }]`.

### 3.3 Responsibilities
- **Model:** Holds `state`, validates cars/renters/dates, computes availability, fees and summary, and saves/loads localStorage. Never touches the DOM or imports a view.
- **Views:** Each extends `View`, builds markup from the data given, and exposes `addHandler...` methods. They never import the model.
- **Controller:** The only file that imports both. It wires each handler to a model call and then a view render. It builds no HTML.

## 4. Views
| View class | Parent element | Handler methods | Owner |
|---|---|---|---|
| CarListView | `.car-list` | addHandlerNew, addHandlerDetails, addHandlerAddRenter | [Member] |
| CarDetailsView | `.details-dialog` | addHandlerEdit, addHandlerDelete | [Member] |
| CarFormView | `.car-dialog` | addHandlerPhoto, addHandlerSubmit | [Member] |
| DateFilterView | `.date-filter` | addHandlerChange, addHandlerQuickRange | [Member] |
| RenterFormView | `.renter-dialog` | addHandlerChange, addHandlerSubmit | [Member] |
| RentersListView | `.renter-list` | addHandlerEdit, addHandlerDelete | [Member] |
| SummaryView | `.summary` | (none; render only) | [Member] |

## 5. Tracing one user action: saving a new renter
1. The user fills the form and presses submit in `RenterFormView.js`; the `addHandlerSubmit` listener reads the form data and calls the handler.
2. `controlSaveRenter(data)` in `controller.js` is called and runs `model.validateRenter(data)`.
3. If there are errors, `renterFormView.renderErrors(errors)` shows them and it stops (this is the validation path).
4. Otherwise `model.addRenter(data)` builds the record with `buildRenter`, pushes it to `state.renters`, and saves to localStorage through `commit`/`saveState`.
5. The controller calls `renterFormView.close()` and `renderAll()`, which calls `rentersListView.render(model.getRenterList())`, `summaryView.render(model.getSummary())` and refreshes the car cards.
6. The views rebuild their markup; the new renter and updated totals appear on screen.

## 6. Screenshots
[3–5 screenshots with one-line captions. Include one validation error.]

## 7. Testing
| # | What we tested | Input | Expected | Actual | Pass? |
|---|---|---|---|---|---|
| 1 | Empty renter name | name = "" | Error "Renter name cannot be empty." | [run it] | [ ] |
| 2 | Invalid contact | "12345" | Error asking for a PH mobile number | [run it] | [ ] |
| 3 | Overlapping booking | Same car, overlapping dates | Error "already booked from..." | [run it] | [ ] |
| 4 | Return before pick-up | End < start | Error on return date | [run it] | [ ] |
| 5 | Duplicate plate | Plate used by another car | Error "Another car already has this plate number." | [run it] | [ ] |
| 6 | Data after reload | Add renter, refresh | Renter still listed | [run it] | [ ] |
| 7 | Delete car with renters | Delete booked car | Blocked with message | [run it] | [ ] |
| 8 | Fee preview | 4 days at 1500 | Shows 6000 | [run it] | [ ] |

## 8. Challenges and solutions
| Challenge | How we solved it | What we learned |
|---|---|---|
| [Your own, e.g. date shifting by a day] | [Dates kept as YYYY-MM-DD strings, UTC math in the model] | [..] |

## 9. Individual contributions
| Member | Views and functions written | Commits | Share (%) |
|---|---|---|---|
| Angel James Abelgas | | [GitHub Insights] | [ ] |
| Kinlee Dionio | | [GitHub Insights] | [ ] |
| Leandro Alexis Lolo | SummaryView, getSummary (fleet utilization), README | [GitHub Insights] | [ ] |

Total = 100%. Signatures: ________ ________ ________

## 10. Individual reflections
100–150 words each, written by each member in their own words.

## 11. References and AI use
**Docs/materials:** ITPFE 1 course materials (Weeks 1–5, including the Week 5 View framework), the Prelim Project requirements.md and written documentation template, MDN Web Docs (ES modules, classes, `localStorage`, `FileReader`, `Intl`/date handling, `<dialog>`), and GitHub docs for Git and GitHub Pages.

| Member | AI tool | What you asked it | Files or functions affected |
|---|---|---|---|
| Angel James Abelgas | Claude Code | Checked the project against requirements.md and listed what was missing | None (review only; no files changed) |
| Angel James Abelgas | Claude Code | Asked about AI disclosure rules | None |
| Angel James Abelgas | Claude Code | Drafted this written documentation template from the code | documentation-draft.md (report only, not app code) |
| Angel James Abelgas | Claude Code | Asked to change the git account name for this project to jamesabelgas70-creator, then commit and push | git config only |
| Angel James Abelgas | Claude Code | Asked to improve the app: auto-listed catalog cars (no manual adding), only the cars and renters cards scroll on desktop, a simpler Add Car form (type and model fields instead of the catalog dropdown), and a display that adjusts to the screen ratio | js/data/catalog.js, js/model.js, js/controller.js, js/views/CarFormView.js, js/views/CarListView.js, css/style.css, index.html |
| Angel James Abelgas | Claude Code | Asked for realistic contact number validation | js/model.js (normalizeContact, validateRenter), js/views/RenterFormView.js |
| Angel James Abelgas | Claude Code | Asked to add a gradient and design to the plain background | css/style.css |
| Angel James Abelgas | Claude Code | Asked how to open the app on a phone, why pictures and data were not saved, and how to make the car pictures show on another PC (images directory) | images/cars/, js/model.js |
| Angel James Abelgas | Claude Code | Analyzed the git history to count commits and lines per member for Section 9 | None (read-only git commands; no files changed) |
| Angel James Abelgas | Claude Code | Finalized this Section 11 from requirements.md | documentation-draft.md (report only, not app code) |
| Kinlee Dionio | [Tool, or "No AI tools used."] | [What you asked it] | [Files or functions affected] |
| Leandro Alexis Lolo | [Tool, or "No AI tools used."] | [What you asked it] | [Files or functions affected] |

Each member must be able to explain every line listed against their name, including lines written with AI help. Code shown only as AI-assisted above (CSS polish, catalog auto-listing, simplified Add Car form, contact validation) is covered by the rows for Angel James Abelgas.
