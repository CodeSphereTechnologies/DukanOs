import React from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { Button } from '../../../components/ui/Button';
import { TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';

export const ReportsPage: React.FC = () => {
  return (
    <PageContainer
      title="Financial & Sales Analytics"
      subtitle="Comprehensive revenue, inventory turns, profit/loss, and customer ledger analytics."
      primaryAction={
        <Button variant="secondary" size="md" leftIcon={<Download className="w-4 h-4" />}>
          Export PDF / A4
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Gross Sales (YTD)"
          value={formatCurrency(4850000)}
          change={{ value: '+24.5%', trend: 'up' }}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Net Operating Profit"
          value={formatCurrency(1240000)}
          change={{ value: '25.5% Margin', trend: 'up' }}
          icon={<TrendingUp className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Operating Expenses"
          value={formatCurrency(680000)}
          change={{ value: 'Rent + Utility + Staff', trend: 'neutral' }}
          icon={<TrendingDown className="w-5 h-5 text-[#991B1B]" />}
        />
        <StatCard
          title="Receivables"
          value={formatCurrency(382400)}
          change={{ value: 'Customer Ledgers', trend: 'neutral' }}
          icon={<DollarSign className="w-5 h-5" />}
        />
      </div>
    </PageContainer>
  );
};
