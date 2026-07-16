# Skulture Payment Gateway (Razorpay) - Quick Guide

This is a concise explanation of how our Razorpay payment gateway integration works.

---

## 1. High-Level Workflow

```
[Customer Checkout] ---> [1. Create Razorpay Order (Backend)]
                                |
                                v
[3. Cryptographic Signature] <--- [2. Present Checkout Modal (Frontend)]
    Verification (Backend)
                                |
                                v
                     [4. Update DB & Notify]
```

1. **Order Session Creation:** Frontend requests payment for an order. Backend locks the database row, calculates the amount (including a 20% advance deposit for custom orders), requests an order ID from the Razorpay API, and logs a pending payment record.
2. **Checkout UI:** Frontend opens the Razorpay popup displaying options (UPI, card, etc.).
3. **Cryptographic Verification:** Upon successful transaction, Razorpay returns a payment signature. The backend verifies this using a secure SHA256 HMAC hash.
4. **Fulfillment:** Backend marks the payment as successful and updates the order status.

---

## 2. Core Code Snippets

### A. Initializing the Razorpay Payment (Backend)
* **File:** `src/services/payment.service.ts`
* **Core Action:** Generates a secure order ID from Razorpay and logs it.

```typescript
// Prepare payment parameters (Razorpay expects amount in paise/cents)
const options = {
  amount: Math.round(payAmount * 100), 
  currency: 'INR',
  receipt: order.orderNumber,
};

// Create the payment session on Razorpay
const rzpOrder = await razorpay.orders.create(options);

// Log the pending payment session in the database
await tx.payment.create({
  data: {
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: payAmount,
    status: 'created',
  },
});
```

### B. Opening Checkout Overlay (Frontend)
* **File:** `app/checkout/page.tsx`
* **Core Action:** Opens the payment modal and sends credentials back on success.

```javascript
const options = {
  key: rzpOrder.keyId,
  amount: rzpOrder.amount,
  order_id: rzpOrder.razorpayOrderId,
  handler: async function (response) {
    // Send response credentials to the backend for signature verification
    await api.post('/payments/verify', {
      orderId: order.id,
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
    });
    router.push(`/orders/${order.id}?payment_success=true`);
  }
};
const rzp = new window.Razorpay(options);
rzp.open();
```

### C. Signature Verification (Backend)
* **File:** `src/utils/razorpayVerify.ts`
* **Core Action:** Verifies the cryptographic signature to prevent tampering.

```typescript
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  // Prevent timing attacks using safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
};
```

---

## 3. Handling Window/Browser Closures After Successful Payment

### The Problem
If a user completes their payment on the Razorpay popup but immediately closes the browser window or tab (or loses internet connection) before the frontend can call the backend `/api/payments/verify` API, how is the order updated?

### The Solution: Webhooks (Asynchronous Fallback Channel)
Even if the client browser window is closed, Razorpay's servers will asynchronously fire a webhook notification request to our server:

1. **Webhook Endpoint:** Razorpay sends a `payment.captured` event payload via `POST /api/payments/webhook`.
2. **Server-to-Server Verification:** The backend confirms the authenticity of the webhook signature payload from Razorpay securely using our `RAZORPAY_WEBHOOK_SECRET`.
3. **Idempotent Database Update:** 
   * The backend checks if the payment record status is already marked `success`.
   * If it isn't, the backend updates the database order payment status to `PAID`/`PENDING` and confirmations, matching what the user paid.
   * This guarantees that the system reconciles the purchase correctly even without frontend interaction.

---

## 4. Payment Failure and Error Handling Flow

The platform handles payment failures, cancellations, and timeouts gracefully to ensure database consistency:

### Scenario A: User Cancels/Closes the Payment Popup
* **Action:** The Razorpay modal triggers the `ondismiss` handler.
* **Result:** The frontend executes `handlePaymentFailure(...)`, cancels the database order, restores items to the user's cart, and redirects to `/orders/[id]?payment_error=cancelled`.

```javascript
// From: app/checkout/page.tsx
const options = {
  // ... other Razorpay options ...
  modal: {
    // Triggers when user cancels payment by closing the overlay popup
    ondismiss: function () {
      handlePaymentFailure(order.id, 'cancelled', '', cartItems);
    }
  }
};

// Cancels the order in database and restores items to local state/DB cart
const handlePaymentFailure = async (orderId, errorType, description = '', itemsToRestore) => {
  try {
    // 1. Send API request to cancel the order
    await api.post(`/orders/${orderId}/cancel`);
    
    // 2. Restore cart items back to client's localStorage
    if (itemsToRestore.length > 0) {
      localStorage.setItem('cart', JSON.stringify(itemsToRestore));
      window.dispatchEvent(new Event('cart-updated'));

      // Sync back to database cart
      await api.delete('/cart/clear').catch(() => {});
      await Promise.all(
        itemsToRestore.map((item) =>
          api.post('/cart/items', {
            productId: item.productId || item.id,
            variantId: item.variantId || null,
            quantity: item.quantity
          }).catch(() => {})
        )
      );
    }
  } catch (err) {
    console.error('Error handling payment failure:', err);
  } finally {
    setIsSubmitting(false);
    // Redirect user to order summary page showing payment cancelled status
    router.push(`/orders/${orderId}?payment_error=${errorType}`);
  }
};
```

### Scenario B: Payment Gateway Transaction Fails (e.g. Card Declined)
* **Action:** The Razorpay SDK fires the `payment.failed` event callback.
* **Result:** The frontend catches the error details and redirects the user to `/orders/[id]?payment_error=failed&description=[error_message]`.
* **Webhook Sync:** Razorpay sends a webhook payload to the backend, which flags the payment status as `failed` in the database.

```javascript
// Frontend - Catching Razorpay Popup Error Callback (app/checkout/page.tsx)
const rzp = new (window as any).Razorpay(options);
rzp.on('payment.failed', function (response) {
  console.error('Razorpay payment failed:', response.error);
  // Execute cleanup and redirect to show error description
  handlePaymentFailure(order.id, 'failed', response.error.description || '', cartItems);
});

// Backend Webhook Event Handler (src/services/payment.service.ts)
} else if (event === 'payment.failed') {
  const paymentDetails = payload.payload.payment.entity;
  const razorpayOrderId = paymentDetails.order_id;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment) return;

    // Update payment record to failed
    await tx.payment.updateMany({
      where: { id: payment.id, status: { not: 'success' } },
      data: { status: 'failed' }
    });

    // Update main order payment status to FAILED
    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: PaymentStatus.FAILED }
    });
  });
}
```

### Scenario C: Security Verification Failure (Signature Mismatch)
* **Action:** The frontend sends signature tokens to `/api/payments/verify`, but verification fails.
* **Result:** The backend updates the local payment status to `failed`, sets the order's paymentStatus to `FAILED`, and throws a `400 Bad Request`.

```typescript
// Backend - Signature Verification Failure Block (src/services/payment.service.ts)
const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
if (!isValid) {
  // Update local payment record to failed status
  await paymentRepository.updateStatus(razorpayOrderId, 'failed');
  
  // Update order's payment status to FAILED in order table
  await orderRepository.updatePaymentStatus(orderId, PaymentStatus.FAILED);
  
  // Throw API application error (results in 400 Bad Request response)
  throw new AppError(400, 'Payment signature verification failed');
}
```

### Scenario D: Abandoned Payments (Automatic Cleanup Job)
* **Action:** The user abandons the checkout screen without paying or canceling.
* **Result:** The backend `paymentCleanup.job.ts` runs every 30 minutes. Any order stuck in `PENDING` payment status for over 30 minutes is automatically marked `CANCELLED`. The system then restores/replenishes all reserved items back to the product inventory database atomically.

```typescript
// Backend Job - (src/jobs/paymentCleanup.job.ts)
const cutoffDate = new Date();
cutoffDate.setMinutes(cutoffDate.getMinutes() - 30); // 30 mins timeout

// Query expired orders
const expiredOrders = await prisma.order.findMany({
  where: {
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    createdAt: { lte: cutoffDate },
  },
  include: { items: true },
});

// Cancel and replenish inventory
for (const order of expiredOrders) {
  await prisma.$transaction(async (tx) => {
    // 1. Cancel the order status in database
    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });

    // 2. Replenish products variant or master inventory stock atomically
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });
}
```



