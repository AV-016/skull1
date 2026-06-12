export const MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: 'Registration successful. Please login.',
    LOGIN_SUCCESS: 'Login successful.',
    LOGOUT_SUCCESS: 'Logout successful.',
    UNAUTHORIZED: 'Unauthorized access. Please log in.',
    FORBIDDEN: 'Access forbidden. You do not have permissions.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    USER_EXISTS: 'A user with this email already exists.',
    USER_NOT_FOUND: 'User not found.',
    TOKEN_EXPIRED: 'Token expired. Please log in again.',
    PASSWORD_RESET_SENT: 'Password reset link sent if email exists.',
    PASSWORD_RESET_SUCCESS: 'Password has been reset successfully.',
  },
  DATABASE: {
    CONNECTION_ERROR: 'Database connection failed.',
    NOT_FOUND: 'Requested resource not found.',
    VALIDATION_ERROR: 'Database validation failed.',
  },
  CART: {
    ITEM_ADDED: 'Item added to cart successfully.',
    ITEM_UPDATED: 'Cart item updated successfully.',
    ITEM_REMOVED: 'Item removed from cart.',
    CLEARED: 'Cart cleared successfully.',
  },
  ORDER: {
    CREATED: 'Order created successfully.',
    NOT_FOUND: 'Order not found.',
    CANCELLED: 'Order cancelled successfully.',
    STATUS_UPDATED: 'Order status updated successfully.',
  },
  PAYMENT: {
    ORDER_CREATED: 'Razorpay order created.',
    VERIFIED: 'Payment verified successfully.',
    VERIFICATION_FAILED: 'Payment verification failed.',
    WEBHOOK_RECEIVED: 'Webhook processed.',
  },
  REVIEW: {
    CREATED: 'Review submitted successfully.',
    NOT_FOUND: 'Review not found.',
    UPDATED: 'Review updated successfully.',
    DELETED: 'Review deleted successfully.',
  },
  CUSTOM_REQUEST: {
    CREATED: 'Custom request submitted successfully.',
    NOT_FOUND: 'Custom request not found.',
    FILE_UPLOADED: 'File uploaded successfully.',
    QUOTATION_CREATED: 'Quotation created successfully.',
    QUOTATION_ACCEPTED: 'Quotation accepted.',
    QUOTATION_REJECTED: 'Quotation rejected.',
  },
  INQUIRY: {
    SUBMITTED: 'Inquiry submitted successfully.',
    NOT_FOUND: 'Inquiry not found.',
    UPDATED: 'Inquiry updated successfully.',
  },
  COMMON: {
    INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again.',
    BAD_REQUEST: 'Invalid request parameters.',
    FILE_UPLOAD_ERROR: 'Failed to upload file.',
  },
};

export default MESSAGES;
