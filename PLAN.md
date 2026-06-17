# Production Plan — Real-Time Delivery Tracking Feature

## What We Are Building

A single demo app with three modules (Delivery Boy, Customer, Dairy Owner) that demonstrates the full real-time delivery tracking flow before it gets integrated into the main business app.

---

## The Full Flow (in plain English)

### Delivery Boy Flow

1. Opens the app → selects "Delivery Boy" role
2. Lands on **DeliveryHomeScreen** — sees today's delivery list (customers, addresses, sequence numbers)
3. Toggles **Online** → background GPS starts, location uploads every 5s to `delivery_boys` table
4. Taps **"Mark Delivery by Maps"** button at the top → opens **DeliveryMapScreen** (new)
5. On **DeliveryMapScreen**:
   - Sees a MapView with all pending customer locations as home markers
   - Each marker shows a number badge (delivery sequence / priority)
   - Taps a customer marker → bottom sheet opens showing customer name, address, delivery number
   - Taps **"Get Directions"** → deep-links to Google Maps app with the customer's coordinates
   - Follows Google Maps to the customer's door
   - Returns to the app (back button or app switch)
6. Back on **DeliveryHomeScreen** (or directly from the sheet) → taps **"Delivered"** on that customer card
7. Repeats for next customer
8. When all done → toggles **Offline** → session ends

### Customer Flow

1. Opens the app → selects "Customer" role
2. Lands on **CustomerHomeScreen** — sees their active order
3. Taps **"Track Order"** → opens **CustomerTrackingScreen**
4. Sees a live map:
   - Delivery boy's current location (animated marker, updates every 5s via polling)
   - Customer's own home location (destination marker)
   - ETA badge 
   - Stale indicator if location not updated in 30s

### Dairy Owner Flow

1. Opens the app → selects "Dairy Owner — Monitor" role
2. Lands on **DairyOwnerMapScreen**
3. Sees full map with:
   - All online delivery boys (bike markers, stale indicator)
   - All customers (home markers, colored by delivery status)
   - Stats overlay: delivered count, pending count, riders online
   - Taps a customer marker → info sheet with ETA and delivery status

---

## The Tracking System — Unified Approach

### The Problem We Are Solving

Right now there are two disconnected tracking systems:
- **System B** (current, works): background task writes rider lat/lng to `delivery_boys` table
- **System A** (broken): `CustomerTrackingScreen` reads from `tracking` table which is never updated

### The Fix — Single Source of Truth: `delivery_boys` table

**Customer tracking reads from `delivery_boys` directly, not from `tracking` table.**

Chain: `order → dairy_customer_id → dairy_customers.delivery_boy_id → delivery_boys.current_lat/lng`

The `tracking` table is kept only for route overlay data (`full_route`, `completed_path`) — not for current position. Current position always comes from `delivery_boys`.

---

## Screen Inventory After This Plan

| Screen | Status | Change |
|--------|--------|--------|
| UserSelectionScreen | Keep | No change |
| DeliveryHomeScreen | Keep + Modify | Add "Mark Delivery by Maps" button |
| **DeliveryMapScreen** | **NEW** | Map with all pending stops, directions deep-link |
| CustomerHomeScreen | Keep | No change |
| CustomerTrackingScreen | Keep + Fix | Fix to read from `delivery_boys` not `tracking` |
| DairyOwnerMapScreen | Keep | No change |
| MainScreen | DELETE | Dead code |
| AdminHomeScreen | DELETE | Dead code |
| AdminTrackingScreen | DELETE | Dead code |
| DeliveryTrackingScreen | DELETE | Replaced by new flow |

---

## New Screen: DeliveryMapScreen

**File:** `src/screens/DeliveryMapScreen.js`

**What it receives (nav params):**
- `deliveries` — the full list of session_deliveries with customer lat/lng
- `deliveryBoyId` — for re-checking online status

**What it shows:**
- `MapView` with `initialRegion` fitted to all customer coordinates
- For each pending delivery: a custom `DeliveryStopMarker` (home icon + number badge)
- For each delivered delivery: same marker but greyed out (optional, can hide)
- Delivery boy's own current location (blue dot or bike icon) — from `Geolocation.getCurrentPosition` locally, no DB read needed here

**On marker tap:**
- Bottom sheet (reuse `CustomerInfoSheet` pattern) shows:
  - Customer name, address, sequence number
  - **"Get Directions"** button → `Linking.openURL('google.maps://...')` with fallback to `https://maps.google.com/...`
  - **"Mark Delivered"** button (optional shortcut — avoids going back to list)

**Navigation:**
- Header back button returns to `DeliveryHomeScreen`
- After marking delivered from the sheet, sheet closes, marker goes grey, list count updates

---

## Changes to Existing Files

### 1. `src/services/trackingService.js` — Add new query

Add `fetchDeliveryBoyLocation(deliveryBoyId)`:
```js
// Reads current_lat, current_lng, last_seen_at from delivery_boys
// Used by CustomerTrackingScreen instead of tracking table
```

Add `fetchCustomerOrderWithRider(orderId)`:
```js
// Joins orders → dairy_customers → delivery_boys
// Returns destination coords + rider current coords in one query
```

### 2. `src/screens/CustomerTrackingScreen.js` — Fix tracking source

Replace `fetchTrackingData(order.id)` with `fetchDeliveryBoyLocation` via the FK chain.
- Keep polling every 5s
- Keep stale detection (30s threshold)
- Keep ETA badge
- Keep animated coordinate
- Remove dependency on `tracking` table for current position

### 3. `src/screens/DeliveryHomeScreen.js` — Add Map button

Add a "Mark Delivery by Maps" button below the progress row (only visible when `isOnline && total > 0`).

On press: navigate to `DeliveryMapScreen` passing `{ deliveries, deliveryBoyId }`.

### 4. `src/navigation/AppNavigator.js` — Register new screen, remove dead ones

- Add `DeliveryMapScreen`
- Remove `DeliveryTrackingScreen` (not registered anyway, but clean up)

### 5. `src/services/googleMapService.js` — Fix API key exposure

Move `GOOGLE_MAPS_API_KEY` to `.env`. Read via `Config.GOOGLE_MAPS_API_KEY`.
Add timeout + AbortController (same pattern as `routeService.js`).

### 6. Delete dead files

```
src/screens/MainScreen.js
src/screens/AdminHomeScreen.js
src/screens/AdminTrackingScreen.js
src/screens/DeliveryTrackingScreen.js
src/services/pollingService.js
```

---

## New Component: DeliveryStopMarker

**File:** `src/components/DeliveryStopMarker.js`

Shows on `DeliveryMapScreen` for each stop:
- Home icon (from assets)
- Number badge overlay (sequence_number)
- Color: black for pending, green for delivered, grey for skipped

---

## Google Maps Deep-Link Format

```js
// Try Google Maps app first, fall back to browser
const lat = customer.lat;
const lng = customer.lng;
const label = encodeURIComponent(customer.name);

const googleMapsUrl = `google.maps://maps.google.com/maps?daddr=${lat},${lng}`;
const fallbackUrl   = `https://maps.google.com/maps?daddr=${lat},${lng}`;

Linking.canOpenURL(googleMapsUrl)
  .then(supported => Linking.openURL(supported ? googleMapsUrl : fallbackUrl));
```

---

## Data Flow Diagram

```
Delivery Boy Device
  └─ backgroundLocationTask (every 20s)
       └─ delivery_boys.current_lat/lng  ←─────────────────────┐
                                                                 │
Customer Device                                                  │ polls every 5s
  └─ CustomerTrackingScreen                                      │
       └─ fetchDeliveryBoyLocation                              │
            └─ orders → dairy_customers → delivery_boys ────────┘

Dairy Owner Device
  └─ DairyOwnerMapScreen
       └─ fetchAllActiveRiders → delivery_boys (already correct)
```

---

## File Change Summary

| File | Action |
|------|--------|
| `src/screens/DeliveryMapScreen.js` | CREATE |
| `src/components/DeliveryStopMarker.js` | CREATE |
| `src/services/trackingService.js` | ADD 2 functions |
| `src/screens/CustomerTrackingScreen.js` | FIX tracking source |
| `src/screens/DeliveryHomeScreen.js` | ADD map button |
| `src/navigation/AppNavigator.js` | ADD DeliveryMapScreen, cleanup |
| `src/services/googleMapService.js` | FIX API key |
| `.env.example` | ADD GOOGLE_MAPS_API_KEY |
| `src/screens/MainScreen.js` | DELETE |
| `src/screens/AdminHomeScreen.js` | DELETE |
| `src/screens/AdminTrackingScreen.js` | DELETE |
| `src/screens/DeliveryTrackingScreen.js` | DELETE |
| `src/services/pollingService.js` | DELETE |

**Total: 2 new files, 6 modified, 5 deleted.**

---

## Implementation Order

1. Delete dead files (no risk, clears noise)
2. Fix `googleMapService.js` API key (security)
3. Add `fetchDeliveryBoyLocation` + `fetchCustomerOrderWithRider` to `trackingService.js`
4. Fix `CustomerTrackingScreen` to use new query (unifies tracking system)
5. Create `DeliveryStopMarker` component
6. Create `DeliveryMapScreen`
7. Add "Mark Delivery by Maps" button to `DeliveryHomeScreen`
8. Register `DeliveryMapScreen` in `AppNavigator`
9. Test full flow end-to-end

---

## What Is NOT In Scope (for the demo)

- Authentication / login — still hardcoded role selection
- Push notifications
- Route polyline on `DeliveryMapScreen` (just markers + Google Maps redirect)
- Offline upload queue for background task
- Supabase Realtime (still polling — can be upgraded post-demo)

---

## Awaiting Approval

Review this plan and confirm. Once approved, implementation starts in the order listed above.
