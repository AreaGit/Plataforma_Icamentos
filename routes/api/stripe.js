const Stripe = require('stripe');
const stripe = Stripe('sk_test_51RYWJjRwp1LaCwq0rzscZupvPLhMqaPu8Pnw14zDlMa0scHMPw0LRLI8Ic3xmoH482GKM4eGLVBzMMxTQbOYBZxr00umB0IGxi');

async function createPixPayment({ amount, email }) {
  if (typeof amount !== 'number') throw new Error('amount deve ser um número em centavos.');
  if (amount < 500) throw new Error('O valor mínimo do Pix é 500 centavos (5 BRL).');
  if (!email) throw new Error('email é obrigatório.');

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'brl',
    payment_method_types: ['pix'],
    receipt_email: email,
    description: 'Pagamento de teste Pix',
  });

  return {
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    qrCodePng: paymentIntent.next_action?.pix_display_qr_code?.image_url_png ?? null,
    pixString: paymentIntent.next_action?.pix_display_qr_code?.pix_string ?? null,
  };
}

(async () => {
  try {
    const pagamento = await createPixPayment({
      amount: 1000, // em centavos: 10 BRL
      email: 'cliente@teste.com',
    });
    console.log(pagamento);
  } catch (err) {
    console.error('Erro:', err.message);
  }
})();