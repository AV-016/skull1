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
