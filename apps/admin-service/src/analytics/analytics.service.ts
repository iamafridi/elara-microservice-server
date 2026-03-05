import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../libs/database/src/entities/user.entity';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';
import { Transaction, TransactionStatus } from '../../../../libs/database/src/entities/transaction.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalMerchants,
      totalJobs,
      totalRevenue,
    ] = await Promise.all([
      this.userRepository.count(),
      this.orderRepository.count(),
      this.productRepository.count(),
      this.merchantRepository.count(),
      this.jobRepository.count(),
      this.getTotalRevenue(),
    ]);

    return {
      totalUsers,
      totalOrders,
      totalProducts,
      totalMerchants,
      totalJobs,
      totalRevenue,
    };
  }

  async getUserGrowth(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= :startDate', { startDate })
      .groupBy('DATE(user.createdAt)')
      .orderBy('DATE(user.createdAt)', 'ASC')
      .getRawMany();

    return users.map(item => ({
      date: item.date,
      count: parseInt(item.count),
    }));
  }

  async getOrderStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const ordersByStatus = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.createdAt >= :startDate', { startDate })
      .groupBy('order.status')
      .getRawMany();

    const ordersByDay = await this.orderRepository
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .where('order.createdAt >= :startDate', { startDate })
      .groupBy('DATE(order.createdAt)')
      .orderBy('DATE(order.createdAt)', 'ASC')
      .getRawMany();

    return {
      byStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      byDay: ordersByDay.map(item => ({
        date: item.date,
        count: parseInt(item.count),
        revenue: parseFloat(item.revenue || '0'),
      })),
    };
  }

  async getRevenueStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenue = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('DATE(transaction.createdAt)', 'date')
      .addSelect('SUM(transaction.amount)', 'amount')
      .addSelect('transaction.status', 'status')
      .where('transaction.createdAt >= :startDate', { startDate })
      .groupBy('DATE(transaction.createdAt), transaction.status')
      .orderBy('DATE(transaction.createdAt)', 'ASC')
      .getRawMany();

    return revenue.map(item => ({
      date: item.date,
      amount: parseFloat(item.amount || '0'),
      status: item.status,
    }));
  }

  async getTopMerchants(limit: number = 10) {
    const merchants = await this.merchantRepository
      .createQueryBuilder('merchant')
      .leftJoinAndSelect('merchant.orders', 'order')
      .select('merchant.id', 'id')
      .addSelect('merchant.storeName', 'storeName')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('SUM(order.totalAmount)', 'totalRevenue')
      .groupBy('merchant.id')
      .orderBy('SUM(order.totalAmount)', 'DESC')
      .limit(limit)
      .getRawMany();

    return merchants.map(item => ({
      id: item.id,
      storeName: item.storeName,
      orderCount: parseInt(item.orderCount || '0'),
      totalRevenue: parseFloat(item.totalRevenue || '0'),
    }));
  }

  async getTopProducts(limit: number = 10) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.orderItems', 'orderItem')
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('COUNT(orderItem.id)', 'orderCount')
      .addSelect('SUM(orderItem.quantity)', 'totalSold')
      .groupBy('product.id')
      .orderBy('SUM(orderItem.quantity)', 'DESC')
      .limit(limit)
      .getRawMany();

    return products.map(item => ({
      id: item.id,
      name: item.name,
      orderCount: parseInt(item.orderCount || '0'),
      totalSold: parseInt(item.totalSold || '0'),
    }));
  }

  async getJobStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const jobsByStatus = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('job.createdAt >= :startDate', { startDate })
      .groupBy('job.status')
      .getRawMany();

    const jobsByCategory = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoin('job.category', 'category')
      .select('category.name', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('job.createdAt >= :startDate', { startDate })
      .groupBy('category.id')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      byStatus: jobsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      byCategory: jobsByCategory.map(item => ({
        category: item.category,
        count: parseInt(item.count),
      })),
    };
  }

  private async getTotalRevenue() {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}
