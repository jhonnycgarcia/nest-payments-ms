import { Injectable } from '@nestjs/common';
import { PaymentSessionDto } from './dto/payment-session.dto';
import Stripe from 'stripe';
import { envs } from 'src/config';
import { Request, Response } from 'express';

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

  async stripeWebhook(request: Request, response: Response) {
    const sig = request.headers['stripe-signature'];

    let event: Stripe.Event;
    const endpointSecret = "whsec_0f86813f3d025dfc4d8ddaa2c92e0a090d36566a81efd757cc085300ebb8b997";

    try {
      event = this.stripe.webhooks.constructEvent(
        request['rawBody'],
        sig!,
        endpointSecret
      );
      console.log({event});
    } catch (error) {
      console.log(error);
      return response.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
  }

}
