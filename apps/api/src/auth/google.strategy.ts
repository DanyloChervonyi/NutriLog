import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile } from "passport-google-oauth20";
import { GoogleStateStore } from "./google-state.store.js";

export type GoogleIdentity = Readonly<{
  googleId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}>;

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID") || "not-configured",
      clientSecret:
        config.get<string>("GOOGLE_CLIENT_SECRET") || "not-configured",
      callbackURL:
        config.get<string>("GOOGLE_CALLBACK_URL") ??
        "http://localhost:4000/api/v1/auth/google/callback",
      scope: ["email", "profile"],
      state: true,
      store: new GoogleStateStore() as NonNullable<
        ConstructorParameters<typeof Strategy>[0]["store"]
      >,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleIdentity {
    const email = profile.emails?.find((item) => item.verified)?.value;
    const verified = profile._json.email_verified === true;

    if (!email || !verified || !profile.id)
      throw new UnauthorizedException(
        "Google account must provide a verified email",
      );

    return {
      googleId: profile.id,
      email: email.trim().toLowerCase(),
      firstName: profile.name?.givenName || null,
      lastName: profile.name?.familyName || null,
    };
  }
}
