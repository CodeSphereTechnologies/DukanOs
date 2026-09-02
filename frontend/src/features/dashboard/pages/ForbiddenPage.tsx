import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <EmptyState
        icon={<ShieldAlert className="w-12 h-12 text-[#DC2626]" />}
        title="403 - Access Prohibited"
        description="Your user role does not have administrative permission to view this operational area."
        action={
          <Button variant="primary" size="md" onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
        }
      />
    </PageContainer>
  );
};
