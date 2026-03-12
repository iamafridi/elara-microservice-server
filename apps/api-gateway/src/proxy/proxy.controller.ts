import {
  All,
  Controller,
  Req,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController() // Exclude from Swagger as this is a catch-all
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  async handleRequest(@Req() req: Request, @Res() res: Response) {
    const { method, path, body, headers, query } = req;

    try {
      const response = await this.proxyService.forwardRequest(
        method,
        path,
        body,
        headers,
        query,
      );

      // Forward response headers
      Object.keys(response.headers).forEach((key) => {
        res.setHeader(key, response.headers[key]);
      });

      // Set CORS headers (in case service doesn't have them)
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      return res.status(response.status).json(response.data);
    } catch (error) {
      this.logger.error(`Proxy error for ${method} ${path}:`, error.message);

      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const errorResponse = error.response || {
        statusCode: status,
        message: error.message || 'Internal server error',
        error: 'Gateway Error',
      };

      return res.status(status).json(errorResponse);
    }
  }
}
