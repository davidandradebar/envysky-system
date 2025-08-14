-- ENVYSKY schema for Neon (PostgreSQL)
-- Run this script once to create tables.

CREATE TABLE IF NOT EXISTS pilots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT,
  birth_date DATE,
  license_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aircrafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tail_number TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  initial_hours NUMERIC NOT NULL DEFAULT 0,
  maintenance_interval_hours NUMERIC NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  hours NUMERIC NOT NULL CHECK (hours > 0),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  aircraft_id UUID NOT NULL REFERENCES aircrafts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration NUMERIC NOT NULL CHECK (duration >= 0),
  status TEXT NOT NULL CHECK (status IN ('scheduled','completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_purchases_pilot ON purchases(pilot_id);
CREATE INDEX IF NOT EXISTS idx_flights_pilot ON flights(pilot_id);
CREATE INDEX IF NOT EXISTS idx_flights_aircraft ON flights(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_flights_date ON flights(date);
