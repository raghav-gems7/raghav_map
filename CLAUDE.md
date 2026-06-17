# Dairy Delivery Tracking App — CLAUDE.md

## Project Overview

React Native 0.85 delivery tracking app with 3 roles: Delivery Boy, Customer, Dairy Owner.
Backend: Supabase (Postgres + Storage). Maps: react-native-maps. Routing: OSRM / Google Directions.

## Tech Stack

- React Native 0.85.3 + React 19
- Supabase JS v2 (auth, database, realtime)
- react-native-maps 1.27
- @react-navigation/native-stack v7
- react-native-background-actions (foreground service for GPS)
- @react-native-community/geolocation
- @mapbox/polyline (route decoding)
- react-native-config (env vars)

## Project Structure

```
src/
  screens/          # One screen per role/flow
  components/       # Shared UI (TrackingMap, ETABadge, OrderCard, markers, sheet)
  services/         # All Supabase + API calls (no business logic in screens)
  navigation/       # AppNavigator.js — single stack navigator
  utils/            # constants.js, distance.js, DemoRoute.js
```

## Active Screens (registered in AppNavigator)

| Screen | Role | Purpose |
|--------|------|---------|
| UserSelectionScreen | All | Role picker entry point |
| DeliveryHomeScreen | Delivery Boy | Session start/stop, delivery list, mark delivered |
| CustomerHomeScreen | Customer | Active orders list |
| CustomerTrackingScreen | Customer | Live map tracking via polling |
| DairyOwnerMapScreen | Owner | Full map with all riders + customers |

## Database Schema (Supabase)

Tables: `delivery_boys`, `dairy_customers`, `orders`, `delivery_sessions`, `session_deliveries`, `tracking`

Key relationships:
- `dairy_customers.delivery_boy_id → delivery_boys.id`
- `orders.dairy_customer_id → dairy_customers.id`
- `orders.assigned_delivery_boy_id → delivery_boys.id`
- `session_deliveries.session_id → delivery_sessions.id`
- `session_deliveries.customer_id → dairy_customers.id`
- `session_deliveries.order_id → orders.id`  ← not yet used in app code
- `tracking.order_id → orders.id`

## Known Architecture Issues (do not re-introduce)

1. **Two tracking systems** — System A writes to `tracking` table (old, order-based). System B writes to `delivery_boys.current_lat/lng` via background task (new, session-based). `CustomerTrackingScreen` reads System A but delivery boy uses System B. Customers see a blank/stale map in production.

2. **`getCustomerOrders` has no customer filter** — returns all `out_for_delivery` orders. Fix: filter by `dairy_customer_id`.

3. **`session_deliveries.order_id` is never read** — schema supports linking delivery stops to orders/tracking but the query doesn't select it.

4. **Google Maps API key was hardcoded** in `googleMapService.js` — must come from `Config.GOOGLE_MAPS_API_KEY` via `.env`.

5. **Dead screens** — `MainScreen`, `AdminHomeScreen`, `AdminTrackingScreen`, `DeliveryTrackingScreen` are not in the navigator and should be deleted.

## Services Layer Rules

- All Supabase calls live in `src/services/` only — never call `supabase` directly from a screen
- Every service function returns `{ data, error }` — never throw from a service
- Use `.maybeSingle()` (not `.single()`) when a missing row is valid
- Use `Promise.all` for parallel independent queries — no sequential queries where parallel is possible

## Environment Variables

Required in `.env` (see `.env.example`):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
GOOGLE_MAPS_API_KEY=
```

## Constants (src/utils/constants.js)

| Constant | Value | Purpose |
|----------|-------|---------|
| TRACKING_INTERVAL | 5000ms | Polling interval for customer/owner screens |
| BG_TRACKING_INTERVAL | 20000ms | Background GPS upload interval |
| MIN_DISTANCE_METERS | 10m | Distance filter before uploading GPS point |
| STALE_LOCATION_THRESHOLD_MS | 30000ms | Age after which rider location is shown as stale |
| AVG_DELIVERY_SPEED_KMH | 20 | Used for straight-line ETA calculation |
| DEFAULT_REGION | Indore, MP (22.688, 75.829) | Map initial region |

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

## Tasks
We are planning to integrate this real-time delivery tracking feature in our daily mobile application, which is for both delivery boy and daily owner, and there is one more one another module for this application, customer application. We are planning to integrate this real-time delivery tracking feature in both of our applications so that the customers and delivery boy and delivery owner can track delivery boys while delivery. So in this, we have an existing feature in our existing workflow is like we have a delivery list in which the delivery boy can see the deliveries need to make of the customers. We will get and customer and delivery list in which there will be customers for whom the delivery boy needs to be needs to mark the delivery. And on tapping that particular card, currently in our existing flow, on tapping that particular card, we just open the Google Maps, we just open the Google Map app through the customer address and through that, the delivery boy can go to the customer's address. But here, we are planning to enhance the flow. We are planning to integrate the real-time delivery tracking in such a manner that the delivery boy can on the delivery page, there will be... There will be a list of customers for whom delivery boy needs to mark the delivery, and there will be an option on the top of the page, mark delivery by the maps. So as the delivery boy opens that feature, mark delivery by maps, on the Google Maps, delivery boy will see all the customers' location on the map. For the customers, we will show a marker, home, and on home icon, there will be some numbers written over there following by the priority of delivery. So the delivery boy will be able to see the customers nearby to mark the deliveries. And as the delivery boy flicks on the customer's marker, there will be an option for get the directions for the particular customer. In this, we will direct the delivery boy to the Google Maps for follwing the path to the customers address And as the customers, the delivery boy complete or reach to the destination of that particular customer, the delivery boy can again come to the delivery list and can mark the delivery for that particular customer. And then the delivery boy can pick the next customer for marking the delivery. Meanwhile, we are just going to follow the same approach we are heading in this repo, that we will fetch the delivery boy's current location in an interval of five seconds, and we will show that delivery boy's location to the dairy owner and to the corresponding customers for whom the delivery boy is going to mark the delivery. And so we are planning just this flow. So please suggest me how can we manage the flow to navigate on map to again for marking the delivery again return to the customer delivery list. So for this, we need to implement the flow and we already have some supervised configuration. If you want, then we can change the supervised configuration accordingly. So if we want to implement the full flow, so first make a full proof plan for this in the doc and then I will read it out and then I will approve and then we can start and we can implement the full flow at the production level. We just want full flow for the production. We will just integrate this feature in our application. First, we are planning the demo of in this repo, then as the demo gets success and then we will implement this in our main business application and customer application in both the applications. So just we need to implement this in a single application with different modules, customer delivery boy and dairy owners module. So let's do it.
