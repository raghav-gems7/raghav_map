# Live Delivery Tracking — Full Flow

### Demo Quick Summary + Production Plan

## Delivery Boy Live Tracking — Feature Flow

### 1. Delivery Boy Goes Online

* Delivery Boy opens the app and goes **Online**.
* Location tracking starts while the Delivery Boy is active.
* Location is checked every **10 seconds**.

### 2. Location Update

* Every 10 seconds, the app gets the Delivery Boy's current location.
* The current location is compared with the last location sent to the backend.
* If the Delivery Boy has moved **10 meters or more**, the new location is sent to the backend.
* If the movement is less than 10 meters, no backend update is sent.
* The first valid location is always sent.

### 3. Recent Location History

* The system keeps the **last 20 successfully updated locations** of the Delivery Boy.
* These locations are used to show the **recent path already travelled** by the Delivery Boy.
* Only the latest 20 points are retained.

### 4. Delivery Boy Starts Delivery

* Delivery Boy selects a customer from the regular delivery list.
* The system records which customer the Delivery Boy is currently delivering to.
* The Dairy Owner and eligible Customer can see the Delivery Boy's current location.

### 5. Dairy Owner Tracking

Dairy Owner can open the **Live Tracking Map**.

The map shows all Delivery Boys belonging to that dairy business.

For each Delivery Boy, the Owner can see:

* Current location
* Delivery status
* Current customer/delivery

When the Owner selects a specific Delivery Boy, the **last 20 location points** can be displayed as a polyline to show the path already travelled.

### 6. Customer Tracking

Customer can track the Delivery Boy assigned to their active delivery/shift.

Customer can see:

* Delivery Boy's current location
* Delivery status
* Recent travelled path

If two Delivery Boys are assigned to the same customer/shift, both can be shown.

### 7. Future Route

* The system will **not predict or display the future route** of the Delivery Boy.
* The polyline will only represent the **actual path already travelled** based on recorded locations.
* No navigation or suggested route will be shown.

### 8. Delivery Completion / Offline

* After completing the delivery, the Delivery Boy moves to the next delivery.
* When the Delivery Boy goes **Offline**, location tracking stops and live location is no longer treated as active.

---


# Production Plan

### SimpleDairyCustomer + Companion Apps

This is the plan for taking the proven demo approach and building it for real, based on the actual production repo (`SimpleDairyCustomer`) — not Supabase, but a Rails REST API with axios + Redux.

## 1. Final End-to-End Flow

**Delivery Boy's phone** → checks GPS every **10s** → if moved **≥10m** (or it's the very first reading) → sends it to our Rails backend → backend saves the current location and keeps a rolling history of the last 20 points → Dairy Owner's app and Customer's app each check the backend every **5s** and draw the current position + a line of the last 20 points for whichever Delivery Boys they're allowed to see.

Same overall shape as the Demo (phone → shared backend → other phones poll it), just built on this app's real stack (Rails API + axios + Redux) instead of Supabase.

## 2. Online/Offline Recommendation

Keep the same **explicit toggle** the Demo uses (Online/Offline switch), not "always tracking in the background."

Reasons:

* There's no always-on realtime connection in this app today — polling only makes sense while a shift is actually active, otherwise it wastes battery/data for nothing.
* Going Online should create a "shift started" record on the backend; going Offline should end it and stop sending updates — same idea as the Demo's delivery session start/stop.

## 3. 10-Second + 10-Meter Location Strategy

Same idea as the Demo, with two changes per the requirements:

* Check GPS every **10 seconds** (Demo uses 20).
* Only send if moved **10+ meters** since the last update that the backend actually confirmed it received (not just the last one attempted) — so a failed send doesn't quietly get "forgotten."
* **Always send the very first location reading immediately**, even if the 10m rule hasn't been checked yet — this is just about "how often to bother sending," never used to detect arrival at a customer's door.

## 4. Last-20-Points / Polyline Strategy

* The backend keeps the history, not the phone. Every time a new location comes in, the backend adds it and drops anything older than the last 20.
* The Owner's and Customer's apps simply ask **"give me the current position and last 20 points"** each time they check in — they don't try to build up the trail themselves from repeated polls (that would break if the app restarts or a poll gets missed).
* The line drawn on the map is always **only where the Delivery Boy has already been** — never a guess at where he's going next.

## 5. Delivery Boy / Owner / Customer Flows

### Delivery Boy

*(App not in this repo yet — flagged below)*

**Online toggle** → sends location every 10s per §4 → same "list of stops + Mark Delivery by Maps" screen idea from the Demo, just pointed at our real backend instead of Supabase.

### Dairy Owner

Sees all their Delivery Boys with:

* Current location
* Status
* Current customer/delivery

Tapping one shows their **last 20 points as a line on the map**.

### Customer

Sees only the Delivery Boy(s) assigned to their current order — if two are assigned, shows both.

Same **current-position + last-20 line**, never a predicted future path.
