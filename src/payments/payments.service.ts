import { Inject, Injectable, Logger } from '@nestjs/common';
import { PaymentSessionDto } from './dto/payment-session.dto';
import Stripe from 'stripe';
import { envs, NATS_SERVICE } from 'src/config';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe = new Stripe(envs.STRIPE_SECRET);

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

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
    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    }
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
          const chargeSucceeded = event.data.object as Stripe.Charge;
          const orderId = chargeSucceeded.metadata.orderId;
          const metadata = chargeSucceeded.metadata;

          const payload = {
            stripePaymentId: chargeSucceeded.id,
            orderId: orderId,
            receipt_url: chargeSucceeded.receipt_url,
          };

          // this.logger.log({ payload });
          this.client.emit('payment.succeeded', payload);
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
