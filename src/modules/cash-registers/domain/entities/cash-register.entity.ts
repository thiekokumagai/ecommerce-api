export class CashRegister {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<CashRegister>) {
    Object.assign(this, data);
  }
}
