export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DISPATCHED = 'DISPATCHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productItemId: string | null;
  productName: string;
  price: number;
  quantity: number;
  variation: string | null;
  imageUrl?: string;
}

export class Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;

  itemsTotal: number;
  freight: number;
  discount: number;
  surcharge: number;
  totalOrder: number;
  totalReceived: number;
  cardFee: number;

  paymentType: string;
  paymentMethod: string;
  pixKey: string | null;

  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  complement: string | null;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  installments?: number;
  paymentDate?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  items?: OrderItem[];

  constructor(data: Partial<Order>) {
    Object.assign(this, data);
  }

  cancel(): void {
    if (this.status === OrderStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed order');
    }
    this.status = OrderStatus.CANCELLED;
  }
}
