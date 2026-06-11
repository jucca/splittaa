# Apuri — sovellusopas (design)

**Date:** 2026-06-10  
**Branch:** 3.0  
**Status:** Approved (grilled)

## Goal

Valinnainen Duolingo-tyylinen sovellusopas (**Apuri**) autentikoituneille käyttäjille. Opastaa navigaatiossa ja uuden kulutuksen luonnissa. Erotetaan profiilin onboardingista (`/profiili/luo`).

## UX

- Header: `HelpCircle`-ikoni kielivalitsimen vasemmalla puolella
- Täyskoko overlay (mobiili koko näyttö; desktop `max-w-lg` keskitetty)
- Segmentoitu edistymispalkki; kokonaismäärä lasketaan uudelleen valintojen jälkeen
- 2 valintavaihetta (personoi polun) + info-vaiheet + lopetus CTA
- Pohjan **Jatka**; valintavaiheissa disabloitu kunnes valinta tehty
- **Ohita** = valmis; **X/ESC** = keskeytä (jatko ikonista)

## Haarautuva polku

- **Käyttötarkoitus** (`useCases`-tagit): kotikulut / matka / satunnaiset / kaikki
- **Kokemustaso:** uusi (kaikki info) / perusteet (ei saldo-perusinfoa) / kokenut (suoraan lopetukseen)
- `resolveSteps(steps, choices)` — puhdas funktio + 12 kombinaation yksikkötestit

## Tila (localStorage)

| Avain | Merkitys |
|-------|----------|
| `splittaa-guide-completed` | Opas valmis tai ohitettu |
| `splittaa-guide-step` | Kesken jäänyt askel-id (jatko) |
| `splittaa-guide-auto-opened` | Auto-open tapahtunut kerran ikinä |

Valinnat: `sessionStorage` oppaan ajan (`splittaa-guide-use-case`, `splittaa-guide-experience`).

## Terminologia

| Term | Meaning |
|------|---------|
| Profiilin onboarding | Pakollinen näyttönimi + käyttäjänimi |
| Apuri | Valinnainen `guide`-namespace UI |

## Out of scope

- Convex `guideCompletedAt` synkka
- Spotlight / DOM-highlight
