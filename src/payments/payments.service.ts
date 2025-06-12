import { Injectable } from '@nestjs/common';
import { PaymentSessionDto } from './dto/payment-session.dto';
import Stripe from 'stripe';
import { envs } from 'src/config';

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.STRIPE_SECRET);

  async createPaymentSessio(paymentSessionDto: PaymentSessionDto) {
    const { items, currency } = paymentSessionDto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },  
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      // colocar aqui el ID de mi ordern
      payment_intent_data: {
        metadata: {},
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel',
    });
    return session;
  }

}
