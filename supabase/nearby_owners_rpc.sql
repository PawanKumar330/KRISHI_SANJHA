-- Nearest equipment-owner matching for farmer dashboards.
--
-- RLS blocks a signed-in farmer from selecting other users' rows in
-- `profiles`, so matching runs through this SECURITY DEFINER function,
-- which returns only public-contact info of APPROVED equipment owners.
-- Distance uses the haversine formula directly on latitude/longitude,
-- so it does not depend on the PostGIS `coordinates` column.
--
-- Run once in the Supabase SQL editor (Dashboard -> SQL -> New query).

CREATE OR REPLACE FUNCTION public.nearby_equipment_owners(
  lat double precision,
  lng double precision,
  radius_km double precision DEFAULT 100
)
RETURNS TABLE (
  owner_id uuid,
  full_name text,
  phone text,
  village_name text,
  panchayat_name text,
  block_name text,
  latitude double precision,
  longitude double precision,
  distance_km double precision
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    q.owner_id,
    q.full_name,
    q.phone,
    q.village_name,
    q.panchayat_name,
    q.block_name,
    q.latitude,
    q.longitude,
    ROUND((q.distance_m / 1000.0)::numeric, 2)::double precision AS distance_km
  FROM (
    SELECT
      p.id AS owner_id,
      p.full_name,
      p.phone,
      v.name AS village_name,
      ap.name AS panchayat_name,
      ab.name AS block_name,
      p.latitude,
      p.longitude,
      6371000 * acos(
        LEAST(1.0,
          cos(radians(lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(lng))
          + sin(radians(lat)) * sin(radians(p.latitude))
        )
      ) AS distance_m
    FROM profiles p
    LEFT JOIN admin_villages v ON v.id = p.village_id
    LEFT JOIN admin_panchayats ap ON ap.id = p.panchayat_id
    LEFT JOIN admin_blocks ab ON ab.id = p.block_id
    WHERE p.role = 'EQUIPMENT_OWNER'
      AND p.account_status = 'APPROVED'
      AND p.is_active
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
  ) q
  WHERE q.distance_m <= radius_km * 1000
  ORDER BY q.distance_m ASC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_equipment_owners(double precision, double precision, double precision)
  TO authenticated;
