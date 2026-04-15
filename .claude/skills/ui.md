# UI/UX Rules — Healthcare App

## Target Users
Elderly + post-surgery + mobility-impaired patients. Reduce cognitive load.

## Sizing (Accessibility)
- Tap target minimum: **48×48dp**
- Body font minimum: **16sp**
- Color contrast: WCAG AA (4.5:1)
- Never convey info via color alone — add text/icon

## Colors (Healthcare palette)
- Primary: calm blue/teal (trust, medical)
- Success green → confirmed, Warning amber → pending, Error red → declined
- No aggressive/dark colors on patient screens

## Booking Status Badges
| Status | Color | Georgian |
|--------|-------|---------|
| pending | amber | მოლოდინში |
| confirmed | green | დადასტურებული |
| declined | red | უარყოფილი |
| completed | gray | დასრულებული |
| cancelled | gray | გაუქმებული |

## Components
- **Buttons**: full-width primary, outlined secondary, red destructive (confirm dialog)
- **Cards**: p-4 min, whole card tappable, status badge top-right
- **Forms**: error below field (not toast), keyboard type per field
- **Empty states**: illustration + Georgian heading + CTA — never "No data"
- **Loading**: skeleton screens for lists, spinner inside button

## Georgian UX
- LTR layout (Georgian is left-to-right)
- Date format: DD/MM/YYYY
- Phone: +995 XXX XXX XXX
- All strings from `strings.ka.ts` — never hardcoded

## Learned in Practice
<!-- /update-skill appends here -->
