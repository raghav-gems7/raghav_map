# Live Delivery Tracking — How It Works (Simple Explanation)

This explains, in plain terms, how the delivery boy's location shows up as a
moving bike icon on the customer's and owner's map — file by file, no
technical background needed.

---

## The basic idea

The delivery boy's phone keeps sending its location to our online database
(Supabase) every few seconds. The customer's phone and the owner's phone
keep checking that same database every few seconds and move a bike icon on
the map to match. Nobody's phone talks directly to another phone — the
database is the middleman both sides check in with.

---

## 1. The delivery boy's phone sends its location

**File:** `src/services/backgroundLocationTask.js`
**File:** `src/utils/distance.js` [here we have logic of 10+ meters displacement]

- While the delivery boy is "Online", this file checks his phone's GPS
  every **20 seconds**.
- **But it doesn't send an update every single time.** It first checks: "did
  he actually move at least 10 meters since the last update?" If he's
  standing still (parked, inside a house delivering), it skips sending
  anything — no point updating the map if he hasn't moved.
- If he *has* moved 10+ meters, it saves his new location to the database.
- The "how far did he move" math lives in `src/utils/distance.js`.

## 2. The customer's map — the moving bike icon

**Files:** `src/screens/CustomerTrackingScreen.js` and
`src/components/TrackingMap.js`

- The customer's app checks the database every **5 seconds** for the
  delivery boy's latest location.
- Instead of the bike icon jumping instantly to the new spot, it **glides**
  smoothly there over about 4 seconds — this is what makes it look like
  natural movement instead of teleporting.
- The customer's own home is shown as a house icon on the map (this one
  doesn't move).

## 3. The road-path line — built, but not turned on yet

- We have the code ready to draw an actual line on the map tracing the road
  the delivery boy is driving on (like a route line in Google Maps).
- Right now, that line **is not showing** — only the bike icon moves, with
  no line behind it. The building blocks for it already exist
  (`src/services/routeService.js` and `src/services/googleMapService.js`),
  they just haven't been connected to the map screen yet.
- This is a small, well-understood next step, not something we'd be
  starting from scratch.


## 4. Delivery boy's own map — "Mark Delivery by Maps"

**File:** `src/screens/DeliveryMapScreen.js`

- Shows all his pending customers as numbered pins on a map (numbered by
  delivery order).
- Tapping a pin gives two buttons: **Get Directions** (opens Google Maps
  app to that address, same as our current flow) and **Mark as Delivered**
  (marks that stop done right there on the map).
- Delivered pins turn green and fade out, so it's easy to see what's left.

## 6. Dairy owner's map — sees everyone at once

**File:** `src/screens/DairyOwnerMapScreen.js`

- Shows every delivery boy and every customer on one map, refreshed every
  5 seconds.
- Delivery boy icons here **jump** to the new spot rather than gliding
  smoothly (unlike the customer's screen) — a small visual difference, not
  a functional one.
- If a delivery boy's location hasn't updated in the last 30 seconds, his
  icon turns grey and shows "Offline" — a simple way to flag if his phone
  or app has stopped sending updates.

---

## Quick summary

| Who sees it | What moves | Smooth or jumpy? | Road-line shown? | How often it updates |
|---|---|---|---|---|
| Customer | Delivery boy's bike icon | Smooth glide | Not yet (built, not connected) | Every 5 seconds |
| Delivery boy | His own pending stops (pins) | Pins don't move (only customers listed) | — | On open / after each action |
| Dairy owner | All delivery boys + all customers | Jumps to new spot | Not yet | Every 5 seconds |
| Delivery boy → database | His live location | — | — | Every 20 seconds, only if moved 10+ meters |
