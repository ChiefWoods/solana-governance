import { Address } from '@solana/web3.js';
import {
    fixDecoderSize,
    getBytesDecoder,
    getConstantDecoder,
    getHiddenPrefixDecoder,
    getStructDecoder,
    transformDecoder,
} from '@solana/codecs';

export const ADMIN_NOMINATED_DISCRIMINATOR = new Uint8Array([22, 247, 53, 33, 59, 59, 68, 112]);

export function getAdminNominatedDiscriminatorBytes(): Uint8Array {
    return ADMIN_NOMINATED_DISCRIMINATOR;
}

export type AdminNominated = { currentAdmin: Address; pendingAdmin: Address };

function getAdminNominatedDecoder() {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['currentAdmin', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
            ['pendingAdmin', transformDecoder(fixDecoderSize(getBytesDecoder(), 32), value => new Address(value))],
        ]),
        [getConstantDecoder(ADMIN_NOMINATED_DISCRIMINATOR)],
    );
}

export function parseAdminNominated(data: Uint8Array): AdminNominated {
    if (!ADMIN_NOMINATED_DISCRIMINATOR.every((byte, index) => data[0 + index] === byte)) {
        throw new Error('ADMINNOMINATED discriminator mismatch');
    }
    const decoded = getAdminNominatedDecoder().decode(data);
    return decoded as AdminNominated;
}
