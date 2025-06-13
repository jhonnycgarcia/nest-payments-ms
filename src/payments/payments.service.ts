import { Injectable } from '@nestjs/common';
import { PaymentSessionDto } from './dto/payment-session.dto';
import Stripe from 'stripe';
import { envs } from 'src/config';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.STRIPE_SECRET);

  async createPaymentSessio(paymentSessionDto: PaymentSessionDto) {
    const { items, currency, orderId } = paymentSessionDto;

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
        metadata: {
          orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.STRIPE_SUCCESS_URL,
      cancel_url: envs.STRIPE_CANCEL_URL,
    });
    return session;
  }

  async stripeWebhook(request: Request, response: Response) {
    const sig = request.headers['stripe-signature'];

    let event: Stripe.Event;
    const endpointSecret = envs.STRIPE_ENDPOINT_SECRET;

    try {
      event = this.stripe.webhooks.constructEvent(
        request['rawBody'],
        sig!,
        endpointSecret
      );
      // console.log({ event });

      switch (event.type) {
        case 'charge.succeeded':
          // TODO: llamar nuestro micro servicio de ordenes
          // console.dir({ event }, { depth: null })
          const chargeSucceeded = event.data.object as Stripe.Charge;
          const orderId = chargeSucceeded.metadata.orderId;
          console.log({ orderId });

          // TODO: llamar nuestro micro servicio de ordenes
          // TODO: llamar nuestro micro servicio de pagos

          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
          break;
      }

      return response.status(200).json({ received: true });

    } catch (error) {
      console.log(error);
      return response.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
  }

}
