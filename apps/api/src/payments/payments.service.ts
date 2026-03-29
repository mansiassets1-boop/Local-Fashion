import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;

  constructor(private readonly config: ConfigService) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID', '');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET', '');

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn('Razorpay not configured — using mock mode');
    }
  }

  async createOrder(amount: number, currency = 'INR', receipt: string, notes?: Record<string, string>) {
    if (!this.razorpay) {
      // Mock mode
      return {
        id: `mock_order_${Date.now()}`,
        amount: amount * 100,
        currency,
        receipt,
        status: 'created',
      };
    }

    const order = await this.razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt,
      notes: notes || {},
    });
    return order;
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    const webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET', '');
    if (!webhookSecret) {
      this.logger.warn('Razorpay webhook secret not configured');
      return true; // Allow in dev
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature),
    );
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET', '');
    if (!keySecret) return true; // Dev mode

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature),
    );
  }

  async createRefund(paymentId: string, amount?: number, notes?: Record<string, string>) {
    if (!this.razorpay) {
      this.logger.debug(`[Mock] Refund for payment ${paymentId}, amount: ${amount}`);
      return { id: `mock_refund_${Date.now()}`, payment_id: paymentId, amount };
    }

    const params: any = { speed: 'normal', notes: notes || {} };
    if (amount) params.amount = Math.round(amount * 100);

    const refund = await (this.razorpay.payments as any).refund(paymentId, params);
    return refund;
  }

  async fetchPayment(paymentId: string) {
    if (!this.razorpay) {
      return { id: paymentId, status: 'captured', amount: 0 };
    }
    return this.razorpay.payments.fetch(paymentId);
  }
}
