import { STAGE_LABEL, canonical } from '../crm/crmHelpers';

export default function DetailsTab({ lead }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
      {[
        { label: 'Phone',        value: lead?.phone },
        { label: 'Name',         value: lead?.name },
        { label: 'Sales stage',  value: lead?.salesStage ? STAGE_LABEL[canonical(lead.salesStage)] || lead.salesStage : null },
        { label: 'Intent',       value: lead?.salesIntent },
        { label: 'Follow up',    value: lead?.nextFollowUpAt ? `${new Date(lead.nextFollowUpAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${lead.nextFollowUpReason ? ` · ${lead.nextFollowUpReason}` : ''}` : null },
        { label: 'Property',     value: lead?.propertyInterest },
        { label: 'Budget',       value: lead?.monthlyBudget ? `R${lead.monthlyBudget}/mo` : null },
        { label: 'Move-in',      value: lead?.moveInDate },
        { label: 'Employment',   value: lead?.employmentType },
        { label: 'Income',       value: lead?.monthlyIncome ? `R${lead.monthlyIncome}/mo` : null },
        { label: 'Status',       value: lead?.workflowStatus?.replace(/_/g, ' ') },
        { label: 'Tenant',       value: lead?.tenantId || 'default' },
        { label: 'Created',      value: lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-ZA') : null },
        { label: 'Last Message', value: lead?.lastMessageAt ? new Date(lead.lastMessageAt).toLocaleDateString('en-ZA') : null },
        { label: 'Assigned To',  value: lead?.assignedAgent },
      ].filter(item => item.value).map((item, i) => (
        <div key={i} className="rounded-[10px] bg-ground px-3.5 py-3">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{item.label}</p>
          <p className="text-sm font-medium break-words text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
