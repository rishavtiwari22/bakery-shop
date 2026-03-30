/**
 * Razorpay payment integration (client-side only).
 * Razorpay key is loaded from .env
 */


const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

/**
 * Initiates a Razorpay payment modal.
 * @param {object} options - { amount (paise), orderId, name, email, contact, settings, onSuccess, onFailure }
 */
export function initiatePayment({ amount, orderId, name, email, contact, settings, onSuccess, onFailure }) {
  if (!window.Razorpay) {
    onFailure?.(new Error('Razorpay SDK not loaded. Check internet connection.'))
    return
  }

  const options = {
    key: RAZORPAY_KEY || 'rzp_test_XXXXXXXXXXXXXXX',
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    name: settings?.name || 'Nice Bakery',
    description: 'Order Payment',
    image: '/logo192.png',
    order_id: orderId,
    handler: function (response) {
      onSuccess?.(response)
    },
    prefill: { name, email, contact },
    notes: { address: settings?.address || settings?.location?.full },
    theme: { color: '#f97316' },
    modal: {
      ondismiss: () => onFailure?.(new Error('Payment cancelled by user.')),
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', (res) => onFailure?.(res.error))
  rzp.open()
}
