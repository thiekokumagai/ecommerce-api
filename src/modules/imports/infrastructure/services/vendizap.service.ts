import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class VendizapService {
  private readonly logger = new Logger(VendizapService.name);
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.VENDIZAP_API_URL || 'https://app.vendizap.com/api',
      headers: {
        'X-Auth-Id': process.env.VENDIZAP_AUTH_ID || '906795',
        'X-Auth-Secret': process.env.VENDIZAP_AUTH_SECRET || 'GHMla7Nebr#uITLn0jA9tCy?FJx%UBh1'
      }
    });
  }

  async getCategories() {
    try {
      const response = await this.client.get('/categorias');
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching categories from Vendizap', error.message);
      throw error;
    }
  }

  async getProducts() {
    try {
      const response = await this.client.get('/produtos');
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching products from Vendizap', error.message);
      throw error;
    }
  }

  async getOrders() {
    try {
      const response = await this.client.get('/pedidos');
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching orders from Vendizap', error.message);
      throw error;
    }
  }
}
