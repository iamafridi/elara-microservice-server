import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuoteService } from './quote.service';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { QuoteStatus } from '../../../../libs/database/src/entities/job-quote.entity';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a quote for a job' })
  @ApiResponse({ status: 201, description: 'Quote submitted' })
  submitQuote(@Body() dto: SubmitQuoteDto) {
    return this.quoteService.submitQuote(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote by ID' })
  @ApiResponse({ status: 200, description: 'Quote details' })
  getQuote(@Param('id') id: string) {
    return this.quoteService.findOne(id);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get quotes for a job' })
  @ApiResponse({ status: 200, description: 'Job quotes' })
  getJobQuotes(@Param('jobId') jobId: string) {
    return this.quoteService.getJobQuotes(jobId);
  }

  @Get('tasker/:taskerId')
  @ApiOperation({ summary: 'Get quotes by tasker' })
  @ApiResponse({ status: 200, description: 'Tasker quotes' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus })
  getTaskerQuotes(
    @Param('taskerId') taskerId: string,
    @Query('status') status?: QuoteStatus,
  ) {
    return this.quoteService.getTaskerQuotes(taskerId, status);
  }

  @Put(':id/accept')
  @ApiOperation({ summary: 'Accept a quote' })
  @ApiResponse({ status: 200, description: 'Quote accepted' })
  acceptQuote(@Param('id') id: string, @Query('customerId') customerId: string) {
    return this.quoteService.acceptQuote(id, customerId);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a quote' })
  @ApiResponse({ status: 200, description: 'Quote rejected' })
  rejectQuote(@Param('id') id: string, @Query('customerId') customerId: string) {
    return this.quoteService.rejectQuote(id, customerId);
  }

  @Put(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw a quote' })
  @ApiResponse({ status: 200, description: 'Quote withdrawn' })
  withdrawQuote(@Param('id') id: string, @Query('taskerId') taskerId: string) {
    return this.quoteService.withdrawQuote(id, taskerId);
  }
}
