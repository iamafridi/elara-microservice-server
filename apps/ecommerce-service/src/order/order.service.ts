import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { OrderItem } from '../../../../libs/database/src/entities/order-item.entity';
import { OrderStatusLog } from '../../../../libs/database/src/entities/order-status-log.entity';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusLog)
    private statusLogRepository: Repository<OrderStatusLog>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new order
   */
  async create(dto: CreateOrderDto) {
    // Calculate totals
    let subtotal = 0;
    for (const item of dto.items) {
      subtotal += item.price * item.quantity;
    }

    const total = subtotal + dto.deliveryFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      userId: dto.userId,
      merchantId: dto.merchantId,
      moduleType: 'grocery' as any,
      subtotal,
      deliveryFee: dto.deliveryFee,
      total,
      status: 'pending' as any,
      deliveryAddress: dto.deliveryAddressId || 'Address not provided',
      deliveryLatitude: 0,
      deliveryLongitude: 0,
      metadata: dto.metadata,
    });

    await this.orderRepository.save(order);

    // Create order items
    for (const itemDto of dto.items) {
      const product = await this.productRepository.findOne({ where: { id: itemDto.productId } });

      const orderItem = this.orderItemRepository.create({
        orderId: order.id,
        productId: itemDto.productId,
        itemName: product?.name || 'Unknown Product',
        quantity: itemDto.quantity,
        unitPrice: itemDto.price,
        totalPrice: itemDto.price * itemDto.quantity,
      });

      await this.orderItemRepository.save(orderItem);

      // Decrease product stock
      await this.decreaseProductStock(itemDto.productId, itemDto.quantity);
    }

    // Create status log
    await this.createStatusLog(order.id, 'pending' as any, 'Order created');

    this.logger.log(`Order created: ${order.id}`);

    return this.findOne(order.id);
  }

  /**
   * Get order by ID
   */
  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user', 'merchant'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  /**
   * Get user orders
   */
  async findByUser(userId: string, limit: number = 50, offset: number = 0) {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: ['merchant'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: orders,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get merchant orders
   */
  async findByMerchant(merchantId: string, limit: number = 50, offset: number = 0, status?: string) {
    const where: any = { merchantId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: orders,
      total,
      limit,
      offset,
    };
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: string, notes?: string) {
    const order = await this.findOne(id);

    order.status = status as any;
    await this.orderRepository.save(order);

    // Create status log
    await this.createStatusLog(id, status as any, notes);

    this.logger.log(`Order status updated: ${id} - ${status}`);

    return this.findOne(id);
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, reason?: string) {
    const order = await this.findOne(id);

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new BadRequestException('Order cannot be cancelled');
    }

    // Restore product stock
    for (const item of order.items) {
      await this.increaseProductStock(item.productId, item.quantity);
    }

    return this.updateStatus(id, 'cancelled', reason);
  }

  /**
   * Get order status history
   */
  async getStatusHistory(id: string) {
    const logs = await this.statusLogRepository.find({
      where: { orderId: id },
      order: { createdAt: 'ASC' },
    });

    return logs;
  }

  /**
   * Create status log
   */
  private async createStatusLog(orderId: string, status: any, notes?: string) {
    const log = this.statusLogRepository.create({
      orderId,
      status,
      notes,
    });

    await this.statusLogRepository.save(log);
  }

  /**
   * Decrease product stock
   */
  private async decreaseProductStock(productId: string, quantity: number) {
    const product = await this.productRepository.findOne({ where: { id: productId } });

    if (product && product.stockEnabled) {
      product.stockCount -= quantity;
      await this.productRepository.save(product);
    }
  }

  /**
   * Increase product stock
   */
  private async increaseProductStock(productId: string, quantity: number) {
    const product = await this.productRepository.findOne({ where: { id: productId } });

    if (product && product.stockEnabled) {
      product.stockCount += quantity;
      await this.productRepository.save(product);
    }
  }
}
