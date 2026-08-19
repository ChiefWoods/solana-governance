'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function ProposalAddressField({ value }: { value: string }) {
    return (
        <Field>
            <FieldLabel>Proposal ID</FieldLabel>
            <Input disabled readOnly className="font-mono" value={value} />
        </Field>
    );
}
