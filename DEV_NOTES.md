# Developer Integration Notes: Payment Gateway & Automated Refunds

This document outlines the recent integration fixes regarding the Razorpay payment gateway configuration and the automated order refund flows.

---

## 1. Payment Gateway Configuration (Test vs. Live Phase)

### Issue
The Razorpay checkout modal was rendering in **Test Mode** even when the application was ready for preview or deployment.

### Root Cause
The environment configuration files had sandbox credentials loaded. Razorpay dynamically decides to load either the test checkout or the live checkout based on the prefix of the `KEY_ID`:
* `rzp_test_...` triggers the **Sandbox / Testing overlay**.
* `rzp_live_...` triggers the **Production / Live overlay**.

### Solution
Devs must configure live keys directly in their local environment setups:
1. **Frontend ([.env.local](file:///c:/Users/ARYAN/Downloads/skull1/.env.local)):**
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
   ```
2. **Backend ([.env](file:///c:/Users/ARYAN/Downloads/skull1/skull1-main/.env)):**
   ```env
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
   ```
*Note: Restart both dev servers after modifying environment variables.*

---

## 2. Admin Order Refund Flow

### Issue
Clicking the "Refund" button in the Admin Orders panel did not return the money to the customer.

### Root Cause
The backend order service only executed a database update, setting the order's `paymentStatus` to `REFUNDED` and `status` to `CANCELLED`. It lacked any connection to the Razorpay API, meaning transactions on Razorpay remained "Captured" (Paid) instead of "Refunded".

### Solution
Integrated the Razorpay payments SDK inside the backend order service [order.service.ts](file:///c:/Users/ARYAN/Downloads/skull1/skull1-main/src/services/order.service.ts#L435-L481). 
* When the Admin clicks the **Refund** button, the backend inspects the order's `paymentMethod` and `paymentId`.
* For card/online transactions, it runs an API call:
  ```typescript
  await razorpay.payments.refund(order.paymentId, {
    amount: Math.round(order.totalAmount * 100),
    notes: { reason: 'Order refunded by Admin' }
  });
  ```
* If the API call succeeds, the transaction is marked as `REFUNDED` in the database, items are restocked, and the state updates locally. If it fails, the error is caught and shown to the admin to prevent database inconsistency.

---

## 3. Customer Cancellation Auto-Refunds

### Issue
When a customer clicked the "Cancel Order" option on their order details screen, they did not receive a refund.

### Root Cause
The customer-facing `cancelOrder` handler only updated the database order status to `CANCELLED` and restocked items, ignoring whether the customer had already paid online.

### Solution
Modified `cancelOrder` in [order.service.ts](file:///c:/Users/ARYAN/Downloads/skull1/skull1-main/src/services/order.service.ts#L275-L324) to execute an automated refund if the transaction is already marked as paid:
* **Check:** If `order.paymentStatus === 'PAID'` and `order.paymentMethod === 'CARD'` (indicating an online payment).
* **Action:** Triggers the Razorpay refund API request prior to committing database changes.
* **Prisma Transaction:** Sets `paymentStatus` to `REFUNDED` and `status` to `CANCELLED` inside a single unified db transaction so cancellations never succeed if refund routing fails.

---

## 4. Dynamic Theme Colors for Active Promotions

### Change
Store administrators can now select and update a custom theme color for any event/promotion.

### Details
* **Database Schema:** Added `themeColor` field to `Event` schema in `schema.prisma`.
* **Backend:** Updated `EventController` to extract, save, and update the chosen `themeColor` parameter.
* **Admin UI:** Added color picker controls inside the Admin Events management modal.
* **Homepage Integration:** Main event banners, count-down timers, and featured redirect CTAs render styles dynamically utilizing the custom promotional hex colors.

---

## 5. Premium Dark-Themed Custom Order Hero Redesign

### Change
Redesigned the customized order banner into an Apple-style split grid against a `#111315` background.

### Details
* **Left Column:** Headline ("You dream it. We print it."), detailed subtitle, checkmark feature list, and rounded CTAs.
* **Right Column:** Split comparing-cards showing concept ("Your idea") vs print outcome ("Final print") side-by-side.
* **Uploader Card:** Embedded interactive file upload trigger supporting STL, OBJ, and STEP 3D models.

---

## 6. FAQ Page Relocation

### Change
Shifted FAQs off the landing screen to declutter the storefront homepage.

### Details
* Created a dedicated FAQs subpage at `/faq` rendering standard faq list accordions.
* Updated Footer navigation layout to link dynamically to the new route.

---

## 7. Custom Request Success Page Enhancements

### Change
Enriched post-submission layout on `/custom-request` to keep users engaged.

### Details
* Added an "Explore More" storefront redirect CTA next to the "Submit Another Request" action.
* Implemented a popular products recommendation grid fetching active catalog items on successful request completions.

---

## 8. Phone Number Formatting & Verification Checks

### Change
Restricted phone fields across checkout, details, and dashboard forms to exactly 10 digits (excluding the country prefix).

### Details
* **Inputs Formatting:** Restricts inputs to numeric entries and caps length to exactly 10 digits after the prefilled `+91` country code.
* **Zod Schemas Validation:** Configured strict regex validations (`/^\+91\d{10}$/`) on frontend/backend API endpoints.
* **Recaptcha Wrapper Fix:** Relocated the invisible reCAPTCHA container to the root of the Account & Dashboard pages, preventing `auth/argument-error` when initializing address verification.

---

## 9. Developer Sticky Board Floating Panel

### Change
Added an interactive, locally-persisted Developer Board widget to track local highlights, deprecations, and features.

### Details
* Rendered a floating toggle FAB at the bottom right corner of the homepage.
* Expands into a slide-over panel where developers can add, edit, and filter sticky notes.
* Saved state changes dynamically inside `localStorage` to persist notes between page reloads.

---

## 10. Shipping Calculation Performance Optimization (Latency Fix)

### Issue
Placing an order was experiencing severe latency ("PLACING ORDER..." taking too much runtime or causing gateway timeouts).

### Root Cause
The database transaction was wrapping the external pincode lookup API call. Because network calls are slow and blocking, the transaction held database row-locks on product tables for too long, causing pool congestion and timeouts.

### Solution
Moved the pincode lookup and shipping rate computation out of the interactive `$transaction` block in [order.service.ts](file:///c:/Users/ARYAN/Downloads/skull1/skull1-main/src/services/order.service.ts#L68-L90). The shipping price is calculated first, and then the transaction only performs stock updates and final order persistence, reducing write lock times to milliseconds.

---

## 11. Order Details Page UI Redesign & 3D Manufacturing Timeline

### Change
Overhauled the order details screen ([page.tsx](file:///c:/Users/ARYAN/Downloads/skull1/app/orders/%5Bid%5D/page.tsx)) into a modern, marketplace-oriented layout while preserving the dark theme.

### Details
* **Production Timeline:** Replaced basic radio buttons with an index-evaluated progress bar mapping: `Order Placed` → `Printing` → `Quality Check` → `Packed` → `Shipped` → `Delivered`. Timeline maps timestamps from status history and turns horizontal on mobile viewports.
* **Payment Card & COD logic:** Enabled dynamic invoice generation for paid online orders and COD orders that have reached the `DELIVERED` status. Delivers the updated payment status **Paid (Collected on Delivery)** for COD orders.
* **Print Specifications:** Renders 3D printer specification attributes (Material, Infill, Color, Layer Height, Nozzle, Dimensions, Weight, and Qty) directly from the admin JSON payload mapping.
* **Support Card:** Integrates quick-action toggles for Live Chat, Raising Tickets, and visualizes active ticket status threads.


