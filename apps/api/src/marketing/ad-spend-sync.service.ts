import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Pulls daily spend from the ad platforms and writes it into AdSpendEntry
 * with source=FACEBOOK / source=GOOGLE, so downstream metrics (CPL, CPA,
 * ROAS...) are computed from real synced numbers instead of guesses.
 *
 * NOT WIRED UP YET — both methods need real credentials before they'll do
 * anything. Add to apps/api/.env:
 *   FACEBOOK_ACCESS_TOKEN=
 *   FACEBOOK_AD_ACCOUNT_ID=
 *   GOOGLE_ADS_DEVELOPER_TOKEN=
 *   GOOGLE_ADS_CUSTOMER_ID=
 *   GOOGLE_ADS_REFRESH_TOKEN=
 *
 * Until those are set, call POST /marketing/ad-spend with source=MANUAL
 * as the interim way to get real numbers into the system — that's what
 * the seed data and the demo dashboard currently use.
 */
@Injectable()
export class AdSpendSyncService {
  private readonly logger = new Logger(AdSpendSyncService.name);

  async syncFromFacebook(date: Date) {
    if (!process.env.FACEBOOK_ACCESS_TOKEN || !process.env.FACEBOOK_AD_ACCOUNT_ID) {
      this.logger.warn('Facebook Ads sync skipped: FACEBOOK_ACCESS_TOKEN / FACEBOOK_AD_ACCOUNT_ID not set.');
      return null;
    }

    // Real implementation once credentials exist:
    // const res = await fetch(
    //   `https://graph.facebook.com/v19.0/act_${process.env.FACEBOOK_AD_ACCOUNT_ID}/insights` +
    //   `?fields=spend&time_range={"since":"${dateStr}","until":"${dateStr}"}` +
    //   `&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`,
    // );
    // const body = await res.json();
    // const amount = Number(body.data?.[0]?.spend ?? 0);
    // return prisma.adSpendEntry.create({ data: { source: 'FACEBOOK', amount, date } });

    throw new Error('syncFromFacebook: not implemented — this is a stub, wire up the fetch above once credentials are set.');
  }

  async syncFromGoogle(date: Date) {
    if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN || !process.env.GOOGLE_ADS_CUSTOMER_ID) {
      this.logger.warn('Google Ads sync skipped: GOOGLE_ADS_DEVELOPER_TOKEN / GOOGLE_ADS_CUSTOMER_ID not set.');
      return null;
    }

    // Real implementation needs the google-ads-api package and OAuth refresh
    // token flow — intentionally left unimplemented until credentials exist.
    throw new Error('syncFromGoogle: not implemented — wire up the Google Ads API client once credentials are set.');
  }
}
