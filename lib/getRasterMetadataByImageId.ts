import { RawDataSource } from "@/types";
import { pool } from "./database";

const cachedQueries: Map<number[], RawDataSource[]> = new Map();

const MAX_CACHE_ENTRIES = Number(process.env.MAX_RASTER_META_CACHE_ENTRIES);

const cachedKeys: number[][] = Array(MAX_CACHE_ENTRIES).fill([]);
let lastKeyIndex: number = 0;

export async function getRasterMetadataByImageId(ids: number[]): Promise<RawDataSource[]> {
    if (ids.length === 0) return [];
    console.log("[Server]: retrieving rasters from database...");

    const cachedResult = cachedQueries.get(ids);
    if (cachedResult) {
        return cachedResult;
    }

    console.log("[Server]: raster meta cache miss, executing db query.");

    const sql = `
        WITH subset AS ( 
            SELECT 
                oge_image.*,
                oge_image_thumb.image_id AS "thumb_image_id",
                thumb
            FROM oge_image
            INNER JOIN oge_image_thumb
            ON         oge_image.image_id = oge_image_thumb.image_id
            WHERE oge_image.image_id
            IN (${Array(ids.length)
            .fill(0)
            .map((_, idx) => `$${idx + 1}`)
            .join(",")}) 
        )
        SELECT  
            image_id AS "rasterId",
            image_identification AS "rasterName",
            platform_name AS "platformName",
            label AS "productCategory",
            name AS "productName",
            crs,
            cover_cloud AS "cloudage",
            text(phenomenon_time) AS "phenomTime",
            upper_left_lat AS "upperLeft",
            least(upper_left_long,lower_left_long) AS "minX",
            least(lower_left_lat,lower_right_lat) AS "minY",
            greatest(upper_right_long,lower_right_long) AS "maxX",
            greatest(upper_left_lat,upper_right_lat) AS "maxY",
            thumb AS "thumbnailUrl"
        FROM        oge_data_resource_product
        INNER JOIN  subset 
        ON          oge_data_resource_product.id = subset.product_key
        INNER JOIN  oge_sensor 
        ON          oge_data_resource_product.sensor_key = oge_sensor.sensor_key;
        `;

    const res = await pool.query(sql, ids);

    cachedKeys[lastKeyIndex] = ids;
    cachedQueries.set(ids, res.rows);
    lastKeyIndex = (lastKeyIndex + 1) % MAX_CACHE_ENTRIES;
    cachedQueries.delete(cachedKeys[lastKeyIndex]);

    return res.rows;
}
