'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DEFAULT_NCN_API_URL, useNcnApi } from '@/contexts/NcnApiContext';
import { RPC_ENDPOINTS, RPC_URLS, useRpc, type RpcEndpoint } from '@/contexts/RpcContext';
import { useIsMobile } from '@/hooks/use-mobile';

function isValidUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function endpointLabel(endpoint: RpcEndpoint) {
    return endpoint[0].toUpperCase() + endpoint.slice(1);
}

function SettingsFields({
    selectedEndpoint,
    onEndpointChange,
    customUrl,
    onCustomUrlChange,
    ncnApiUrlInput,
    onNcnApiUrlChange,
}: {
    selectedEndpoint: RpcEndpoint;
    onEndpointChange: (endpoint: RpcEndpoint) => void;
    customUrl: string;
    onCustomUrlChange: (url: string) => void;
    ncnApiUrlInput: string;
    onNcnApiUrlChange: (url: string) => void;
}) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-3">
                <Label>RPC Endpoint</Label>
                <RadioGroup value={selectedEndpoint} onValueChange={value => onEndpointChange(value as RpcEndpoint)}>
                    {RPC_ENDPOINTS.map(endpoint => (
                        <Label key={endpoint} htmlFor={`rpc-${endpoint}`} className="w-full cursor-pointer">
                            <RadioGroupItem value={endpoint} id={`rpc-${endpoint}`} />
                            {endpointLabel(endpoint)}
                        </Label>
                    ))}
                </RadioGroup>
                <Input
                    id="custom-rpc-url"
                    type="url"
                    value={customUrl}
                    onChange={event => onCustomUrlChange(event.target.value)}
                    placeholder="http://localhost:8899"
                    disabled={selectedEndpoint !== 'custom'}
                />
            </div>

            <div className="grid gap-3">
                <Label htmlFor="ncn-api-url">NCN API URL</Label>
                <Input
                    id="ncn-api-url"
                    type="url"
                    value={ncnApiUrlInput}
                    onChange={event => onNcnApiUrlChange(event.target.value)}
                    placeholder={DEFAULT_NCN_API_URL}
                />
            </div>
        </div>
    );
}

function SettingsActions({
    canSave,
    onCancel,
    onSave,
}: {
    canSave: boolean;
    onCancel: () => void;
    onSave: () => void;
}) {
    return (
        <>
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
            </Button>
            <Button type="button" disabled={!canSave} onClick={onSave}>
                Save
            </Button>
        </>
    );
}

export function SettingsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const isMobile = useIsMobile();
    const { endpointType, endpointUrl, setEndpoint } = useRpc();
    const { ncnApiUrl, setNcnApiUrl } = useNcnApi();

    const [selectedEndpoint, setSelectedEndpoint] = useState<RpcEndpoint>(endpointType);
    const [customUrl, setCustomUrl] = useState('');
    const [ncnApiUrlInput, setNcnApiUrlInput] = useState(
        ncnApiUrl === DEFAULT_NCN_API_URL ? '' : ncnApiUrl,
    );

    useEffect(() => {
        if (open) {
            setSelectedEndpoint(endpointType);
            setCustomUrl(endpointType === 'custom' ? endpointUrl : '');
            setNcnApiUrlInput(ncnApiUrl === DEFAULT_NCN_API_URL ? '' : ncnApiUrl);
        }
    }, [open, endpointType, endpointUrl, ncnApiUrl]);

    const ncnUrlIsValid = ncnApiUrlInput.trim() === '' || isValidUrl(ncnApiUrlInput);
    const canSave = (selectedEndpoint !== 'custom' || (customUrl.length > 0 && isValidUrl(customUrl))) && ncnUrlIsValid;

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleSave = () => {
        const url = selectedEndpoint === 'custom' ? customUrl : RPC_URLS[selectedEndpoint];
        setEndpoint(selectedEndpoint, url);

        const trimmedNcnUrl = ncnApiUrlInput.trim();
        if (trimmedNcnUrl && isValidUrl(trimmedNcnUrl)) {
            setNcnApiUrl(trimmedNcnUrl.replace(/\/$/, ''));
        } else {
            setNcnApiUrl(DEFAULT_NCN_API_URL);
        }

        onOpenChange(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            handleClose();
            return;
        }
        onOpenChange(true);
    };

    const fields = (
        <SettingsFields
            selectedEndpoint={selectedEndpoint}
            onEndpointChange={setSelectedEndpoint}
            customUrl={customUrl}
            onCustomUrlChange={setCustomUrl}
            ncnApiUrlInput={ncnApiUrlInput}
            onNcnApiUrlChange={setNcnApiUrlInput}
        />
    );

    const actions = <SettingsActions canSave={canSave} onCancel={handleClose} onSave={handleSave} />;

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection="down" showSwipeHandle>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Settings</DrawerTitle>
                        <DrawerDescription className="sr-only">
                            Configure your RPC endpoint and NCN API settings
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4">{fields}</div>
                    <DrawerFooter className="pt-4">{actions}</DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription className="sr-only">
                        Configure your RPC endpoint and NCN API settings
                    </DialogDescription>
                </DialogHeader>
                {fields}
                <DialogFooter>{actions}</DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
