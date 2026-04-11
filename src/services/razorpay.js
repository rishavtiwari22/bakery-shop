/**
 * Razorpay payment integration (client-side only).
 * Razorpay key is loaded from .env
 */


const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

/**
 * Dynamically loads the Razorpay checkout script.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Initiates a Razorpay payment modal.
 * @param {object} options - { amount (paise), orderId, name, email, contact, settings, onSuccess, onFailure }
 */
export async function initiatePayment({ amount, orderId, name, email, contact, settings, onSuccess, onFailure }) {
  if (!window.Razorpay) {
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      onFailure?.(new Error('Razorpay SDK failed to load. Check your internet connection.'))
      return
    }
  }

  const options = {
    key: RAZORPAY_KEY || 'rzp_test_XXXXXXXXXXXXXXX',
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    // Account details pulled automatically from Dashboard
    order_id: orderId,
    payment_capture: 1, // Auto-capture payments immediately
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
