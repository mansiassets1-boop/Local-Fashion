import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EtaService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Calculate delivery ETA in minutes.
   * ETA = prep_time_mins + (distance_km / 25 * 60) + traffic_buffer
   * traffic_buffer: 9-11 → 10min, 18-21 → 15min, else 5min
   */
  calculateEta(prepTimeMins: number, distanceMeters: number): number {
    const distanceKm = distanceMeters / 1000;
    const travelMins = (distanceKm / 25) * 60;
    const trafficBuffer = this.getTrafficBuffer();
    return Math.ceil(prepTimeMins + travelMins + trafficBuffer);
  }

  private getTrafficBuffer(): number {
    const hour = new Date().getHours();
    if (hour >= 9 && hour < 11) return 10;
    if (hour >= 18 && hour < 21) return 15;
    return 5;
  }

  async calculateEtaForStore(storeId: string, deliveryLat: number, deliveryLng: number): Promise<number> {
    const result = await this.db.query(
      `SELECT prep_time_mins,
              ST_Distance(
                ST_MakePoint(lng, lat)::geography,
                ST_MakePoint($2, $3)::geography
              ) AS distance_meters
       FROM stores WHERE id = $1`,
      [storeId, deliveryLng, deliveryLat],
    );
    const store = result.rows[0];
    if (!store) return 45; // default fallback
    return this.calculateEta(store.prep_time_mins, parseFloat(store.distance_meters));
  }

  /**
   * Get ETA for a product based on store location and typical delivery area.
   * If no delivery coordinates are available, use store's city center.
   */
  async getProductEta(storeId: string, cityId: string): Promise<number> {
    const result = await this.db.query(
      `SELECT s.prep_time_mins, s.lat AS store_lat, s.lng AS store_lng,
              c.lat AS city_lat, c.lng AS city_lng,
              ST_Distance(
                ST_MakePoint(s.lng, s.lat)::geography,
                ST_MakePoint(c.lng, c.lat)::geography
              ) AS distance_to_center
       FROM stores s
       JOIN cities c ON c.id = s.city_id
       WHERE s.id = $1 AND s.city_id = $2`,
      [storeId, cityId],
    );
    const row = result.rows[0];
    if (!row) return 45;
    return this.calculateEta(row.prep_time_mins, parseFloat(row.distance_to_center));
  }
}
