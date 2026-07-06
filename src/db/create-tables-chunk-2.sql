-- Chunk 2/3: Tables 5-8 (tenants, transactions, requests, request_photos)
-- Execute this after Chunk 1 succeeds

-- Table: tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  status tenant_status DEFAULT 'active' NOT NULL,
  id_type TEXT,
  id_number TEXT,
  notification_sent_30_days BOOLEAN DEFAULT FALSE,
  notification_sent_7_days BOOLEAN DEFAULT FALSE,
  last_renewal_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX tenants_room_id_idx ON tenants (room_id);
CREATE INDEX tenants_lease_end_idx ON tenants (lease_end);

-- Table: transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  room_id UUID REFERENCES rooms(id),
  type transaction_type NOT NULL,
  category transaction_category NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX transactions_property_id_idx ON transactions (property_id);
CREATE INDEX transactions_transaction_date_idx ON transactions (transaction_date);

-- Table: requests
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  room_id UUID REFERENCES rooms(id),
  type request_type NOT NULL,
  title TEXT NOT NULL,
  status request_status DEFAULT 'menunggu' NOT NULL,
  estimated_cost INTEGER,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX requests_property_id_idx ON requests (property_id);
CREATE INDEX requests_status_idx ON requests (status);

-- Table: request_photos
CREATE TABLE request_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id),
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_type photo_type NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX request_photos_request_id_idx ON request_photos (request_id);
