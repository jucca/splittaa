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

- **Käyttötarkoitus** (monivalinta): kotikulut / matka / satunnaiset — useita valittavissa (union-logiikka)
- **Kaikki edellä** — UI-pikavalinta, valitsee/poistaa kaikki kolme tagia kerralla (ei tallenneta erillisenä tagina)
- **Oma idea** — vapaaehtoinen tekstikenttä (max 120 merkkiä); ei vaikuta polkuun jos tageja valittu; pelkkä teksti → laaja opaspolku (kaikki info-vaiheet)
- **Jatka** aktivoituu kun vähintään yksi tagi tai oma teksti
- **Kokemustaso:** uusi (kaikki info) / perusteet (ei saldo-perusinfoa) / kokenut (suoraan lopetukseen)
- `resolveSteps(steps, choices)` — puhdas funktio; info-vaihe näytetään jos mikä tahansa valituista tageista täyttää `step.useCases`-ehdon

## Tila (localStorage)

| Avain | Merkitys |
|-------|----------|
| `splittaa-guide-completed` | Opas valmis tai ohitettu |
| `splittaa-guide-step` | Kesken jäänyt askel-id (jatko) |
| `splittaa-guide-auto-opened` | Auto-open tapahtunut kerran ikinä |

Valinnat: `sessionStorage` oppaan ajan (`splittaa-guide-use-cases` JSON-array, `splittaa-guide-use-case-custom`, `splittaa-guide-experience`).

## Terminologia

| Term | Meaning |
|------|---------|
| Profiilin onboarding | Pakollinen näyttönimi + käyttäjänimi |
| Apuri | Valinnainen `guide`-namespace UI |

## Out of scope

- Convex `guideCompletedAt` synkka
- Spotlight / DOM-highlight
