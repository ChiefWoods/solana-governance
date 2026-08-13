import { Address } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getConstantDecoder,
    getHiddenPrefixDecoder,
    getStructDecoder,
    transformDecoder,
} from '@solana/codecs';

export const ADMIN_TRANSFERRED_DISCRIMINATOR = new Uint8Array([255, 147, 182, 5, 199, 217, 38, 179]);

export function getAdminTransferredDiscriminatorBytes(): Uint8Array {
    return ADMIN_TRANSFERRED_DISCRIMINATOR;
}

export type AdminTransferred = { previousAdmin: Address; newAdmin: Address };

function getAdminTransferredDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['previousAdmin', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['newAdmin', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ]),
        [getConstantDecoder(ADMIN_TRANSFERRED_DISCRIMINATOR)],
    );
}

export function parseAdminTransferred(data: Uint8Array): AdminTransferred {
    if (!ADMIN_TRANSFERRED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('ADMINTRANSFERRED discriminator mismatch');
    }
    const decoded = getAdminTransferredDecoder().decode(data);
    return decoded as AdminTransferred;
}
