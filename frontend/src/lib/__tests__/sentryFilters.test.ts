import type { ErrorEvent as SentryErrorEvent, Exception, StackFrame } from '@sentry/nextjs';
import { describe, expect, it } from 'vitest';

import { isThirdPartyScriptError } from '../sentryFilters';

type Mechanism = NonNullable<Exception['mechanism']>;

const UNHANDLED: Mechanism = {
    type: 'auto.browser.global_handlers.onerror',
    handled: false,
};
const HANDLED: Mechanism = { type: 'generic', handled: true };

const frames = (...filenames: string[]): StackFrame[] => filenames.map(filename => ({ filename, in_app: true }));

const exception = (
    value: string,
    mechanism: Mechanism | undefined,
    stackFrames: StackFrame[] | undefined,
): Exception => ({
    type: 'Error',
    value,
    mechanism,
    ...(stackFrames ? { stacktrace: { frames: stackFrames } } : {}),
});

const eventOf = (...values: Exception[]): SentryErrorEvent => ({
    type: undefined,
    exception: { values },
});

const SSE_ERROR_FRAMES = frames(
    'app:///inpage.js',
    'app:///inpage.js',
    'app:///inpage.js',
    'app:///inpage.js',
    'app:///inpage.js',
    'app:///inpage.js',
);

describe('isThirdPartyScriptError', () => {
    it('drops the unhandled wallet provider crash we see in production', () => {
        expect(
            isThirdPartyScriptError(eventOf(exception('func sseError not found', UNHANDLED, SSE_ERROR_FRAMES))),
        ).toBe(true);
    });

    it('keeps the same error when our own code captured it', () => {
        expect(isThirdPartyScriptError(eventOf(exception('func sseError not found', HANDLED, SSE_ERROR_FRAMES)))).toBe(
            false,
        );
    });

    it('drops unhandled errors from wrapped browser callbacks', () => {
        expect(
            isThirdPartyScriptError(
                eventOf(
                    exception(
                        'func sseError not found',
                        { type: 'auto.browser.browserapierrors.setTimeout', handled: false },
                        SSE_ERROR_FRAMES,
                    ),
                ),
            ),
        ).toBe(true);
    });

    it.each([
        'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/inpage.js',
        'moz-extension://d9b3a4f1-0c62-4f7e-8f2b-1a2b3c4d5e6f/inpage.js',
        'safari-web-extension://B2D5A1C0-1234-4321-ABCD-0123456789AB/inpage.js',
        'webkit-masked-url://hidden/',
        'chrome://internals/script.js',
        'inpage.js',
        'app:///inpage.js?v=2',
        'app:///inpage.js?',
        'app:///inpage.js#bridge',
        'app:///inpage.js?v=2#bridge',
        'app:///inpage.js?redirect=/_next/static/chunks/page.js',
        'inpage.js?v=2',
        'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/inpage.js?v=2',
    ])('drops unhandled errors from %s', filename => {
        expect(isThirdPartyScriptError(eventOf(exception('provider bridge failed', UNHANDLED, frames(filename))))).toBe(
            true,
        );
    });

    it("keeps an unhandled error whose stack runs from our code into the wallet's", () => {
        expect(
            isThirdPartyScriptError(
                eventOf(
                    exception(
                        'func sseError not found',
                        UNHANDLED,
                        frames('app:///_next/static/chunks/app/page-abc123.js', 'app:///inpage.js'),
                    ),
                ),
            ),
        ).toBe(false);
    });

    it('keeps unhandled errors entirely within our own bundles', () => {
        expect(
            isThirdPartyScriptError(
                eventOf(
                    exception(
                        'Cannot read properties of undefined',
                        UNHANDLED,
                        frames(
                            'app:///_next/static/chunks/main-app-0a1b2c3d.js',
                            'app:///_next/static/chunks/app/proposal/[proposalPk]/page-abc123.js',
                        ),
                    ),
                ),
            ),
        ).toBe(false);
    });

    it.each(['app:///_next/static/chunks/app/page-abc123.js?v=2', 'app:///_next/static/chunks/app/page-abc123.js#L1'])(
        'keeps our own bundles when %s carries a query or fragment',
        filename => {
            expect(isThirdPartyScriptError(eventOf(exception('boom', UNHANDLED, frames(filename))))).toBe(false);
        },
    );

    it('keeps errors from inline scripts in our own documents', () => {
        expect(isThirdPartyScriptError(eventOf(exception('boom', UNHANDLED, frames('app:///proposal/abc'))))).toBe(
            false,
        );
    });

    it.each([
        ['a message event', { type: undefined, message: 'something happened' } as SentryErrorEvent],
        ['an event with no exception values', eventOf()],
        ['an exception with no stack trace', eventOf(exception('Script error.', UNHANDLED, undefined))],
        [
            'an exception with no attributable frames',
            eventOf(exception('boom', UNHANDLED, frames('<anonymous>', '[native code]'))),
        ],
        [
            'an exception with frames but no filenames',
            eventOf({
                type: 'Error',
                value: 'boom',
                mechanism: UNHANDLED,
                stacktrace: { frames: [{ function: 'b', in_app: true }] },
            }),
        ],
        ['an exception with no mechanism', eventOf(exception('boom', undefined, SSE_ERROR_FRAMES))],
    ])('keeps %s', (_label, event) => {
        expect(isThirdPartyScriptError(event)).toBe(false);
    });

    it('keeps a chained error when one of its causes is ours', () => {
        expect(
            isThirdPartyScriptError(
                eventOf(
                    exception(
                        'failed to build transaction',
                        { type: 'chained', handled: true, parent_id: 0 },
                        frames('app:///_next/static/chunks/app/page-abc123.js'),
                    ),
                    exception('func sseError not found', UNHANDLED, SSE_ERROR_FRAMES),
                ),
            ),
        ).toBe(false);
    });

    it('drops a chained error that is third party the whole way down', () => {
        expect(
            isThirdPartyScriptError(
                eventOf(
                    exception(
                        'provider bridge failed',
                        { type: 'chained', handled: true, parent_id: 0 },
                        frames('app:///inpage.js'),
                    ),
                    exception('func sseError not found', UNHANDLED, SSE_ERROR_FRAMES),
                ),
            ),
        ).toBe(true);
    });

    it('treats any root-level script under app:/// as third party', () => {
        expect(
            isThirdPartyScriptError(eventOf(exception('boom', UNHANDLED, frames('app:///some-root-script.js')))),
        ).toBe(true);
    });
});
