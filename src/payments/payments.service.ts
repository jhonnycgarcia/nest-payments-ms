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
    console.log({ sig })
    return response.status(200).json({sig});
    // const event = this.stripe.webhooks.constructEvent(request.rawBody, sig, envs.STRIPE_WEBHOOK_SECRET);
    // return event;
  }

}
