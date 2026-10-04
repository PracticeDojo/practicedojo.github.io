# TEST PROTOCOL — Practice Dojo v2.23.0

Scope: **Feature 42 · Optional accounts.** Needs: migration `20261004200000_accounts.sql` applied, Discord
and/or Google enabled in Supabase → Authentication → Providers, and the URL Configuration set. Use two
browsers (or a normal and a private window): **A** and **B**, same account.

## A — Signed out stays free
| # | Step | Expected |
|---|------|----------|
| A.1 | Fresh browser, DevTools → Network, load the app | No request to `supabase.co`, no supabase-js download. Header shows **Sign in** |
| A.2 | Click **Sign in** | "Sign in (optional)" with *Continue with Discord*, *Continue with Google*, *Not now* |

## B — Signing in
| # | Step | Expected |
|---|------|----------|
| B.1 | A: with a couple of decks and sessions on the device, *Continue with Discord* | Discord asks to authorise; you return to the app; toast "Signed in as …"; header shows your name and avatar |
| B.2 | The first-sign-in offer | "Save N decks and M sessions from this device to your account?" → **All** → toast "Saved …" |
| B.3 | A browser that had shared a link before signing in | After sign-in, Library → Shared still lists those links |
| B.4 | Account menu (header) | "Signed in with Discord · …", usage "N of 50 sessions, M of 200 decks", *Sign out* |

## C — Sessions across devices
| # | Step | Expected |
|---|------|----------|
| C.1 | A: Library → Sessions | Rows say *This device · Account* |
| C.2 | A: open one, play a few moves | Library row: *Changes not in account* |
| C.3 | A: topbar **Save** | Toast "Saved … on this device and in your account"; row back to *This device · Account* |
| C.4 | B: sign in, Library → Sessions | *Only in your account* group; **Open** downloads and opens it |
| C.5 | B: play and Save; then A: Library | A's row: *Newer in account*; the cloud button downloads it |
| C.6 | A and B both change the same session; Save on A, then Save on B | B gets "This session changed on another device" → *Overwrite with mine* or *Save mine as a copy* |
| C.7 | Delete a session that's on both | Choices *This device / Account / Both*, each doing what it says |

## D — Decks
| # | Step | Expected |
|---|------|----------|
| D.1 | A: save a new deck (Library → Decks → New deck, or the field's *Save to My decks*) | Row shows the *Account* badge |
| D.2 | B: open Library → Decks | The deck appears (pulled from the account) and in the home chips |
| D.3 | Delete it on B | "removed from this device and your account"; gone from A after its next Library → Decks |

## E — Sign out
| # | Step | Expected |
|---|------|----------|
| E.1 | Account menu → Sign out → *Keep on this device* | Header back to **Sign in**; device copies remain (device-only now) |
| E.2 | Sign in again, sign out → *Remove from this device* | Account copies leave this device; the account keeps them |

## F — Limits and errors
| # | Step | Expected |
|---|------|----------|
| F.1 | A Discord account that's already a Dojo account, from a browser with share links | "That account already exists… Sign in to it instead?" |
| F.2 | Cancel at the Discord / Google screen | Back in the app, no error |
| F.3 | Offline, Save while signed in | "Saved on this device only" with the reason |
