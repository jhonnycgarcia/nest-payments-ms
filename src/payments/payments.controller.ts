import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { MessagePattern } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // @Post('create-payment-session')
  @MessagePattern('create.payment.session')
  createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto) {
    return { paymentSessionDto };
    return this.paymentsService.createPaymentSessio(paymentSessionDto);
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payment successful',
    };
  }

  @Get('cancel')
  cancel() {
    return {
      ok: true,
      message: 'Payment cancelled',
    };
  }

  @Post('webhook')
  async stripeWebhook(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    return this.paymentsService.stripeWebhook(request, response);
  }

}
