-- Chunk 1/3: ENUMs + Tables 1-4 (profiles, properties, rooms, room_photos)
-- Execute this first in Supabase SQL Editor

-- ENUMs
CREATE TYPE user_role AS ENUM ('super_admin', 'investor_only', 'manager_only', 'investor_manager');
CREATE TYPE room_type AS ENUM ('bulanan', 'harian');
CREATE TYPE room_status AS ENUM ('tersedia', 'terisi');
CREATE TYPE tenant_status AS ENUM ('active', 'expiring_soon', 'expired', 'ended');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_category AS ENUM ('monthly_rent', 'daily_rent', 'property_tax', 'management_fees', 'maintenance', 'other');
CREATE TYPE request_type AS ENUM ('maintenance', 'inventory');
CREATE TYPE request_status AS ENUM ('menunggu', 'diizinkan', 'ditolak', 'proses', 'selesai');
CREATE TYPE photo_type AS ENUM ('interior', 'exterior', 'amenities', 'before', 'after', 'evidence', 'other');

-- Table: profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL,
  property_id UUID,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX profiles_email_idx ON profiles (email);
CREATE INDEX profiles_property_id_idx ON profiles (property_id);

-- Table: properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  total_rooms INTEGER DEFAULT 8 NOT NULL,
  investment_scheme TEXT DEFAULT 'hybrid' NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  room_number INTEGER NOT NULL,
  type room_type NOT NULL,
  status room_status DEFAULT 'tersedia' NOT NULL,
  monthly_price INTEGER,
  daily_price INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX rooms_property_id_idx ON rooms (property_id);
CREATE UNIQUE INDEX rooms_property_id_room_number_unique ON rooms (property_id, room_number);

-- Table: room_photos
CREATE TABLE room_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_type photo_type NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX room_photos_room_id_idx ON room_photos (room_id);
