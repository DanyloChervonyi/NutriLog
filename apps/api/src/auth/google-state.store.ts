import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

type OAuthMetadata = Readonly<{ authorizationURL: string; tokenURL: string; clientID: string }>;
type StoreCallback = (error: Error | null, state: unknown) => void;
type VerifyCallback = (error: Error | null, valid: boolean, state: unknown) => void;

const STATE_COOKIE = 'nutrilog_google_state';
const LOCALE_COOKIE = 'nutrilog_google_locale';

export class GoogleStateStore {
  store(req: Request, callback: StoreCallback): void;
  store(
    req: Request,
    _meta: OAuthMetadata,
    callback: StoreCallback,
  ): void;
  store(
    req: Request,
    metaOrCallback: OAuthMetadata | StoreCallback,
    maybeCallback?: StoreCallback,
  ): void {
    const callback = typeof metaOrCallback === 'function' ? metaOrCallback : maybeCallback;
    const state = randomBytes(32).toString('hex');
    const response = req.res;

    if (!response || !callback) {
      callback?.(new Error('Unable to store OAuth state'), undefined);
      return;
    }

    response.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/google',
      maxAge: 5 * 60 * 1000,
    });
    const locale = typeof req.query.locale === 'string' && ['ru', 'uk', 'en'].includes(req.query.locale)
      ? req.query.locale
      : 'ru';
    response.cookie(LOCALE_COOKIE, locale, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/google',
      maxAge: 5 * 60 * 1000,
    });
    callback(null, state);
  }

  verify(req: Request, state: string, callback: VerifyCallback): void;
  verify(
    req: Request,
    state: string,
    _meta: OAuthMetadata,
    callback: VerifyCallback,
  ): void;
  verify(
    req: Request,
    state: string,
    metaOrCallback: OAuthMetadata | VerifyCallback,
    maybeCallback?: VerifyCallback,
  ): void {
    const callback = typeof metaOrCallback === 'function' ? metaOrCallback : maybeCallback;
    const storedState: unknown = req.cookies?.[STATE_COOKIE];
    req.res?.clearCookie(STATE_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/google',
    });
    req.res?.clearCookie(LOCALE_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/google',
    });

    if (!callback || typeof state !== 'string' || typeof storedState !== 'string' || storedState.length !== state.length) {
      callback?.(null, false, undefined);
      return;
    }

    callback(
      null,
      timingSafeEqual(Buffer.from(storedState), Buffer.from(state)),
      undefined,
    );
  }
}
