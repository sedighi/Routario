# Installation & Deployment Guide

Routario is designed to scale from a single-board computer running SQLite up to enterprise fleet operations handling thousands of concurrent GPS trackers.

This guide covers:
- **Quick Start:** For local development and testing (Python + SQLite).
- **Capacity Planning & Sizing:** Benchmark and resource evaluation for **500+ Teltonika FMB920** devices.
- **Docker vs. Bare-Metal:** Performance comparison and architectural trade-offs.
- **Production Setup via Docker Compose:** Containerized deployment with **PostgreSQL 18**, PostGIS, **Redis 8**, and Valhalla.
- **Database Table Partitioning (PostgreSQL 18):** Architecture and roadmap for partitioning high-volume telematics tables (`position_records`).
- **Production Setup on Bare-Metal:** Comprehensive step-by-step enterprise guide for **AlmaLinux 9 / RHEL** and **Ubuntu 22.04 / 24.04**.
- **Teltonika FMB920 Configuration:** Recommended tracker firmware parameters for optimal throughput.

---

## Quick Start (Python + SQLite)

The fastest way to test Routario locally. No external database or Docker setup required.

### 1. Clone the repository

```bash
git clone https://github.com/bkbilly/routario.git
cd routario
```

### 2. Install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Run the application

```bash
python app/main.py
```

Routario creates `routario.db` in WAL mode on first run and starts the web interface on port **8000**.

Open `http://localhost:8000` and log in with default credentials:

| Username | Password |
|---|---|
| `admin` | `admin_password` |

!!! warning "Change default password"
    Update the admin password immediately upon first login, or set `ADMIN_PASSWORD` in your environment prior to launching.

!!! note "SQLite Scope"
    SQLite with WAL mode works smoothly for testing and small personal deployments (< 20 devices). For fleets of 500+ devices, **PostgreSQL 18 is mandatory**.

---

## Capacity Planning: 500 Teltonika FMB920 Devices

Connecting 500 active Teltonika FMB920 GPS trackers represents a moderate-to-high concurrent telematics workload. Below is a detailed technical analysis of throughput, network bandwidth, database growth, and hardware requirements.

### 1. Ingestion Profile & Throughput

Teltonika FMB920 devices use persistent TCP connections (Codec 8 or Codec 8E) to port **5027**.

* **Reporting Frequency (Typical Fleet Profile):**
  - **Moving (Ignition ON):** Sends position every 10 to 20 seconds (or on turns/heading changes > 20°).
  - **Stationary (Ignition OFF / Parked):** Sends heartbeat every 300 to 600 seconds.
* **Peak Load Scenario (All 500 vehicles moving simultaneously):**
  - At 10s intervals: $500 \div 10 = \mathbf{50\text{ packets/second (Hz)}}$.
  - At 20s intervals: $500 \div 20 = \mathbf{25\text{ packets/second (Hz)}}$.
* **Average Daily Ingestion Rate:**
  - With a realistic mix (e.g., 60% moving, 40% parked during peak work hours), the system handles **15 to 35 incoming packets/second**.
* **Network Bandwidth:**
  - Teltonika Codec 8/8E AVL record size: ~80 to 200 bytes per packet.
  - Server ACK response: 4 bytes (`0x00000001`).
  - Total network ingress: $50\text{ pkts/s} \times 200\text{ bytes} \approx \mathbf{10\text{ KB/s}}\ (80\text{ Kbps})$.
  - Total network egress: $50\text{ pkts/s} \times 4\text{ bytes} \approx \mathbf{200\text{ B/s}}\ (1.6\text{ Kbps})$.
  - **Verdict:** Network bandwidth consumption is negligible (< 1 Mbps). Any standard VPS or bare-metal connection (100 Mbps+) handles this effortlessly.

### 2. Concurrent TCP Connections

* 500 devices maintain 500 persistent TCP sockets to port 5027.
* Routario's gateway is built on Python's asynchronous event loop (`asyncio.start_server` backed by `uvloop` on Linux).
* In `uvloop`, 500 idle/low-traffic TCP sockets consume only **~10 MB to 15 MB of RAM** and minimal CPU. The event loop can easily sustain up to 10,000+ concurrent connections on a single core.

### 3. Database Write Volume & Storage Calculations

Every incoming position triggers:
1. Fast indexed lookup for the device by IMEI.
2. Device state update (`device_states` table).
3. Trip detection, auto-driver assignment, and odometer accumulation.
4. Record insertion into `position_records`.
5. Alert evaluation (geofences, overspeed, crash, battery/ignition).
6. Real-time WebSocket notification broadcast.

| Metric | 1 Day | 1 Month (30 days) | 1 Year (365 days) |
|---|---|---|---|
| **Records per Device** (avg. 12h moving @ 15s + 12h stop @ 300s) | ~3,000 records | ~90,000 records | ~1,095,000 records |
| **Fleet Total (500 Devices)** | ~1.5 Million records | ~45 Million records | ~547 Million records |
| **Storage Footprint** (~320 bytes / row + indexes) | ~480 MB / day | ~14.4 GB / month | ~175 GB / year |

### 4. Data Retention & Downsampling Strategy

To keep database queries fast and control disk space over time, Routario includes a built-in background downsampling and retention engine (`app/core/retention.py`).

Configure your `.env` with the following recommended production parameters:

```env
# Automatically prune high-frequency points older than 30 days to 60-second intervals
# (Critical events like ignition changes, speed stops, and SOS alerts are preserved)
HISTORY_DOWNSAMPLE_ENABLED=true
HISTORY_DOWNSAMPLE_DAYS=30
HISTORY_DOWNSAMPLE_INTERVAL_SECONDS=60

# Permanently delete records older than 180 days (6 months)
HISTORY_RETENTION_ENABLED=true
HISTORY_RETENTION_DAYS=180
```

With downsampling enabled, storage growth drops by **~65%** after the first 30 days, stabilizing disk consumption between **40 GB and 60 GB** for 500 devices.

### 5. Hardware Sizing Guide

| Component | Minimum (500 Devices) | Recommended (500 – 1,500 Devices) |
|---|---|---|
| **CPU** | 4 vCPU (x86_64, 2.4 GHz+) | 8 vCPU (AMD EPYC or Intel Xeon) |
| **RAM** | 8 GB | 16 GB |
| **Disk** | 100 GB NVMe SSD | 250 GB+ NVMe SSD |
| **OS** | AlmaLinux 9 / Rocky Linux 9 / Ubuntu 22.04+ | AlmaLinux 9 / Ubuntu 24.04 LTS |
| **Network** | 100 Mbps uplink, 1 static IPv4 | 1 Gbps uplink, 1 static IPv4 |

> [!IMPORTANT]
> **Storage IOPS is the primary performance factor.** Do not use slow mechanical HDDs or network-attached storage with low IOPS (e.g. AWS EBS gp2 under 3000 IOPS). Use local NVMe or high-IOPS SSDs to ensure smooth position insertion alongside report queries.

---

## Docker vs. Bare-Metal Performance Analysis

A common question when scaling to hundreds of devices is whether running in Docker causes performance degradation.

### Performance Comparison

| Factor | Docker (Bridge Network) | Docker (`network_mode: host`) | Bare-Metal |
|---|---|---|---|
| **CPU & Memory Overhead** | < 1% (Native cgroups) | < 1% (Native cgroups) | 0% (Baseline) |
| **Disk I/O** | Native (via Named Volumes) | Native (via Named Volumes) | Native |
| **Network Latency** | +0.1ms (via `docker-proxy` & NAT) | 0ms (Direct host socket) | 0ms (Direct host socket) |
| **Conntrack Saturation Risk** | Minor with thousands of short-lived connections | None | None |
| **PostgreSQL Connection** | Over internal virtual bridge | Local TCP or UNIX socket | Direct UNIX domain socket (~15% faster) |
| **Process Management** | Docker daemon | Docker daemon | Native `systemd` + `journald` |

### The Verdict

* **Docker is completely capable of handling 500 FMB920 devices.** On Linux, Docker containers do not run inside a virtual machine; they run as native kernel processes using cgroups and namespaces. The CPU and memory overhead is practically zero.
* **Network Consideration:** The only minor overhead in Docker is the `docker-proxy` userland proxy and `iptables` NAT for persistent TCP connections. For 500 persistent TCP connections, this overhead is minimal. If desired, you can eliminate it completely by setting `network_mode: host` in `docker-compose.yml`.
* **When to choose Bare-Metal:**
  - High-security enterprise environments where Docker daemons are restricted.
  - Environments requiring direct `systemd` process supervision, native cgroup limits, and centralized syslog/journald integration.
  - Maximum raw I/O throughput: Bare-metal enables Routario to connect to PostgreSQL over a **UNIX domain socket** (`/var/run/postgresql/.s.PGSQL.5432`), bypassing the TCP network stack entirely for a 15–20% latency reduction.

---

## Production Setup A: Docker Compose (Optimized)

Docker Compose provides a fast, reproducible production deployment with **PostgreSQL 18**, PostGIS, **Redis 8**, and Valhalla.

### 1. Prerequisites

- Linux server (AlmaLinux 9, Rocky Linux 9, or Ubuntu 22.04/24.04)
- Docker Engine 24+ and Docker Compose v2+
- Open firewall ports: `80`, `443` (Web/API), `5027` (Teltonika TCP/UDP)

### 2. Sizing & Resource Tuning for 500 Devices

The `docker-compose.yml` is configured with PostgreSQL 18 and PostGIS 3.6 (`postgis/postgis:18-3.6-alpine` or shorthand `postgis/postgis:18`), tuned with 1GB shared memory (`shm_size`), partition pruning flags, and Redis 8:

```yaml
services:

  # ── Routario Application ─────────────────────────────────────────
  routario:
    image: bkbillybk/routario:dev
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://routario:routariopass@postgres/routario?ssl=disable
      REDIS_URL: redis://redis:6379
      GEOCODING_ENABLED: false
      VAPID_PUBLIC_KEY: BGQ3prURPQf1PZSGKySh1Mnr1QQW5pVBGZujTApG_zhqKxGnCz30umqOg5Mh_Q6U-5nNbAtO7XVmz0G-3RR_84g
      VAPID_PRIVATE_KEY: Qk1wdfPJGQ4nLYN2SKLNGR5Z3FrD-e_LfByMTUyJ3Hc
      VALHALLA_URL: http://valhalla:8002
    volumes:
      - ./routario/uploads:/app/web/uploads
    ports:
      # Web UI + API + WebSocket
      - "8000:8000"
      # GPS Protocol Ports
      - "5001:5001"     # TK103
      - "5013:5013"     # H02
      - "5020:5020"     # Meitrack
      - "5023:5023"     # GT06 / Concox
      - "5026:5026"     # Queclink
      - "5027:5027"     # Teltonika (TCP)
      - "5027:5027/udp" # Teltonika (UDP)
      - "5055:5055"     # OsmAnd
      - "5149:5149"     # Flespi
    deploy:
      resources:
        limits:
          cpus: '3.0'
          memory: 3G
        reservations:
          cpus: '1.0'
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
    networks:
      - routario-net

  # ── PostgreSQL 18 + PostGIS ──────────────────────────────────────
  postgres:
    image: postgis/postgis:18-3.6-alpine
    restart: unless-stopped
    shm_size: 1g
    command: >
      postgres
      -c shared_buffers=2GB
      -c effective_cache_size=6GB
      -c work_mem=32MB
      -c maintenance_work_mem=512MB
      -c min_wal_size=1GB
      -c max_wal_size=4GB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c max_connections=150
      -c enable_partition_pruning=on
      -c enable_partitionwise_join=on
      -c enable_partitionwise_aggregate=on
      -c max_parallel_workers_per_gather=4
      -c max_parallel_workers=8
      -c max_parallel_maintenance_workers=4
    environment:
      POSTGRES_DB:       routario
      POSTGRES_USER:     routario
      POSTGRES_PASSWORD: ${DB_PASSWORD:-routariopass}
      PGDATA:            /var/lib/postgresql/data
    volumes:
      - ./routario/postgres:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '3.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
    networks:
      - routario-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U routario -d routario"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Redis (v8) ───────────────────────────────────────────────────
  redis:
    image: redis:8-alpine
    restart: unless-stopped
    command: redis-server --loglevel warning --maxmemory 512mb --maxmemory-policy allkeys-lru
    networks:
      - routario-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Valhalla (road speed limit lookups) ──────────────────────────
  valhalla:
    image: ghcr.io/valhalla/valhalla-scripted:latest
    restart: unless-stopped
    volumes:
      - ./routario/valhalla:/custom_files
    environment:
      - tile_urls=https://download.geofabrik.de/asia/iran-latest.osm.pbf
      - build_admins=True
      - build_time_zones=True
    ports:
      - "8002:8002"
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 3G
    networks:
      - routario-net
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8002/status || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 300s

networks:
  routario-net:
    driver: bridge
```

### 3. Production `.env` for Docker

```env
# Database
DATABASE_URL=postgresql+asyncpg://routario:YourStrongDbPassword@postgres/routario?ssl=disable
DB_POOL_SIZE=30
DB_MAX_OVERFLOW=60

# Redis & WebSockets
REDIS_URL=redis://redis:6379
ENABLE_WEBSOCKETS=true

# Security
SECRET_KEY=generate_a_64_character_random_hex_string
ADMIN_USERNAME=admin
ADMIN_EMAIL=fleet-admin@yourdomain.com
ADMIN_PASSWORD=SetAStrongInitialPasswordHere

# History Downsampling & Retention (Crucial for 500+ devices)
HISTORY_DOWNSAMPLE_ENABLED=true
HISTORY_DOWNSAMPLE_DAYS=30
HISTORY_DOWNSAMPLE_INTERVAL_SECONDS=60
HISTORY_RETENTION_ENABLED=true
HISTORY_RETENTION_DAYS=180

# Protocol Gateway
TCP_HOST=0.0.0.0
UDP_HOST=0.0.0.0

# Optional Routing & Geocoding
VALHALLA_URL=http://valhalla:8002
VALHALLA_ENABLED=true
GEOCODING_ENABLED=false
```

### 4. Start the Stack

```bash
docker compose up -d
docker compose logs -f routario
```

---

## Database Table Partitioning (PostgreSQL 18)

When maintaining 500+ GPS trackers generating **1.5M+ position records per day**, standard unpartitioned tables become sluggish after several months due to index bloat, large B-tree depth, and expensive `DELETE` queries during retention cleanups.

PostgreSQL 18 introduces significant enhancements to declarative partitioning, including:
1. **Asynchronous I/O (AIO) Engine:** Rapid multi-partition sequential scans and index seeks.
2. **Dynamic Partition Pruning:** Queries targeting a specific time range (e.g. "where was vehicle X between Oct 10 and Oct 15?") automatically skip scanning partitions for other months, reducing query execution time by 90%+.
3. **Instant Zero-Cost Retention Drops:** Instead of running heavy `DELETE FROM position_records WHERE device_time < ...` (which locks rows, causes WAL write spikes, and requires heavy VACUUMing), dropping an expired month partition is instantaneous:
   ```sql
   DROP TABLE position_records_y2025m01;
   ```

### 1. Partitioning Schema Design

In PostgreSQL, declarative range partitioning for `position_records` requires the partition key (`device_time`) to be part of the table's Primary Key.

```sql
-- 1. Create the parent partitioned table
CREATE TABLE position_records_partitioned (
    id BIGSERIAL,
    device_id INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    course DOUBLE PRECISION,
    satellites INTEGER,
    ignition BOOLEAN,
    sensors JSONB DEFAULT '{}'::jsonb,
    device_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    server_time TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    driver_id INTEGER,
    CONSTRAINT pk_position_records PRIMARY KEY (id, device_time)
) PARTITION BY RANGE (device_time);

-- 2. Create monthly child partitions (e.g. for Year 2026)
CREATE TABLE position_records_y2026m10 PARTITION OF position_records_partitioned
    FOR VALUES FROM ('2026-10-01 00:00:00') TO ('2026-11-01 00:00:00');

CREATE TABLE position_records_y2026m11 PARTITION OF position_records_partitioned
    FOR VALUES FROM ('2026-11-01 00:00:00') TO ('2026-12-01 00:00:00');

CREATE TABLE position_records_y2026m12 PARTITION OF position_records_partitioned
    FOR VALUES FROM ('2026-12-01 00:00:00') TO ('2027-01-01 00:00:00');

-- 3. Default partition for fallback (safety net)
CREATE TABLE position_records_default PARTITION OF position_records_partitioned DEFAULT;

-- 4. Create local indexes on each partition (indexes are automatically inherited)
CREATE INDEX idx_pos_partition_device_time ON position_records_partitioned (device_id, device_time DESC);
CREATE INDEX idx_pos_partition_server_time ON position_records_partitioned (server_time DESC);
CREATE INDEX idx_pos_partition_sensors_gin ON position_records_partitioned USING GIN (sensors);
```

### 2. Migration Roadmap from Existing Table

To migrate an active Routario deployment to partitioned storage without data loss:

```bash
# 1. Stop Routario application
sudo systemctl stop routario   # or: docker compose stop routario

# 2. In PostgreSQL:
sudo -u postgres psql -d routario
```

```sql
BEGIN;

-- Rename existing table
ALTER TABLE position_records RENAME TO position_records_old;

-- Create the new partitioned table (as shown above)
CREATE TABLE position_records (
    id BIGSERIAL,
    device_id INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    course DOUBLE PRECISION,
    satellites INTEGER,
    ignition BOOLEAN,
    sensors JSONB DEFAULT '{}'::jsonb,
    device_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    server_time TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    driver_id INTEGER,
    CONSTRAINT pk_position_records PRIMARY KEY (id, device_time)
) PARTITION BY RANGE (device_time);

-- Create initial monthly partitions
CREATE TABLE position_records_y2026m10 PARTITION OF position_records
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE position_records_y2026m11 PARTITION OF position_records
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE position_records_default PARTITION OF position_records DEFAULT;

-- Create indexes
CREATE INDEX idx_pos_dev_time ON position_records (device_id, device_time DESC);

-- Migrate recent data (e.g. current month)
INSERT INTO position_records SELECT * FROM position_records_old;

COMMIT;
```

```bash
# 3. Restart Routario application
sudo systemctl start routario   # or: docker compose start routario
```

### 3. Automated Partition Maintenance (`pg_partman`)

In PostgreSQL 18, the extension `pg_partman` can be enabled to automatically create future partitions and drop expired partitions without manual intervention:

```sql
CREATE SCHEMA partman;
CREATE EXTENSION pg_partman SCHEMA partman;

-- Configure monthly automated partitioning with 6 months retention:
SELECT partman.create_parent(
    p_parent_table => 'public.position_records',
    p_control => 'device_time',
    p_type => 'native',
    p_interval => 'monthly',
    p_premake => 2
);

-- Update retention policy (180 days)
UPDATE partman.part_config
SET retention = '180 days',
    retention_keep_table = false
WHERE parent_table = 'public.position_records';
```

---

## Production Setup B: Bare-Metal (Enterprise Linux)

Bare-metal deployment is ideal for maximizing raw throughput, utilizing PostgreSQL UNIX domain sockets, and managing services natively via `systemd`.

Instructions below support both **AlmaLinux 9 / Rocky Linux 9 / RHEL 9** and **Ubuntu 22.04 / 24.04 LTS**.

### 1. System Packages & Python 3.11+ Setup

=== "AlmaLinux 9 / RHEL 9"

    ```bash
    # Update system packages
    sudo dnf update -y
    sudo dnf install -y epel-release dnf-plugins-core
    sudo dnf config-manager --set-enabled crb

    # Install build tools, Python 3.11, Git, and development headers
    sudo dnf install -y \
      python3.11 python3.11-devel python3.11-pip \
      git gcc gcc-c++ make openssl-devel libffi-devel \
      libpq-devel
    ```

=== "Ubuntu 22.04 / 24.04"

    ```bash
    # Update package lists
    sudo apt update && sudo apt upgrade -y

    # Install Python 3, build tools, Git, and PostgreSQL client headers
    sudo apt install -y \
      python3 python3-venv python3-pip python3-dev \
      build-essential git libpq-dev libffi-dev libssl-dev
    ```

---

### 2. Linux Kernel & Socket Tuning

When 500 devices keep persistent connections open, standard Linux file descriptor and TCP queue limits must be adjusted.

Create `/etc/sysctl.d/99-routario.conf`:

```ini
# Maximum open file handles system-wide
fs.file-max = 2097152

# Socket backlog and connection queue limits
net.core.somaxconn = 8192
net.ipv4.tcp_max_syn_backlog = 8192

# Fast TCP socket recycling and connection reuse
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# TCP buffer tuning for persistent connections
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Keepalive timeouts for mobile networks
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 5
```

Apply the parameters immediately:

```bash
sudo sysctl --system
```

Set file descriptor limits in `/etc/security/limits.d/routario.conf`:

```ini
routario soft nofile 65535
routario hard nofile 65535
routario soft nproc  32768
routario hard nproc  32768
```

---

### 3. PostgreSQL 18 & PostGIS Installation

Install PostgreSQL 18 and PostGIS:

=== "AlmaLinux 9 / RHEL 9"

    ```bash
    # Install PostgreSQL official repository
    sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
    sudo dnf -qy module disable postgresql

    # Install PostgreSQL 18 and PostGIS 3.6
    sudo dnf install -y postgresql18-server postgresql18-contrib postgis36_18

    # Initialize and enable service
    sudo /usr/pgsql-18/bin/postgresql-18-setup initdb
    sudo systemctl enable --now postgresql-18
    ```

=== "Ubuntu 22.04 / 24.04"

    ```bash
    # Install PostgreSQL 18 and PostGIS from official apt repositories
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
    sudo apt update
    sudo apt install -y postgresql-18 postgresql-18-postgis-3
    sudo systemctl enable --now postgresql
    ```

#### Optimize `postgresql.conf` for 500 Devices & Partitioning

Edit `postgresql.conf` (located at `/var/lib/pgsql/18/data/postgresql.conf` on AlmaLinux or `/etc/postgresql/18/main/postgresql.conf` on Ubuntu):

```ini
# Memory Configuration (Assumes 16 GB RAM server)
shared_buffers = 4GB                  # 25% of total RAM
effective_cache_size = 10GB           # ~65-75% of total RAM
maintenance_work_mem = 512MB
work_mem = 32MB
wal_buffers = 16MB

# Checkpoints and Write Performance
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Storage & Connection Tuning (NVMe SSD)
random_page_cost = 1.1
effective_io_concurrency = 200
max_connections = 150

# PostgreSQL 18 Partitioning & Parallel Query Tuning
enable_partition_pruning = on
enable_partitionwise_join = on
enable_partitionwise_aggregate = on
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
```

Restart PostgreSQL:

```bash
# AlmaLinux
sudo systemctl restart postgresql-18

# Ubuntu
sudo systemctl restart postgresql
```

#### Create Database and User

```bash
sudo -u postgres psql -c "CREATE USER routario WITH PASSWORD 'YourStrongDbPassword';"
sudo -u postgres psql -c "CREATE DATABASE routario OWNER routario;"
sudo -u postgres psql -d routario -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d routario -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

---

### 4. Redis Installation

Install and start Redis 8:

=== "AlmaLinux 9 / RHEL 9"

    ```bash
    sudo dnf install -y redis
    sudo systemctl enable --now redis
    ```

=== "Ubuntu 22.04 / 24.04"

    ```bash
    sudo apt install -y redis-server
    sudo systemctl enable --now redis-server
    ```

Verify Redis is working:

```bash
redis-cli ping  # Expected output: PONG
```

---

### 5. Create System User & Deploy Application

Create a dedicated system user without shell login:

```bash
sudo useradd -r -m -d /opt/routario -s /bin/bash routario
```

Clone Routario into `/opt/routario/app`:

```bash
sudo -u routario git clone https://github.com/bkbilly/routario.git /opt/routario/app
cd /opt/routario/app
```

Create virtual environment and install dependencies:

```bash
sudo -u routario python3.11 -m venv /opt/routario/venv
sudo -u routario /opt/routario/venv/bin/pip install --upgrade pip setuptools wheel
sudo -u routario /opt/routario/venv/bin/pip install -r requirements.txt
```

Create upload directories with correct permissions:

```bash
sudo -u routario mkdir -p /opt/routario/app/web/uploads/{voice,dashcam,company-branding,tickets,tts}
```

---

### 6. Configure Production `.env`

Create `/opt/routario/app/.env` owned by `routario:routario` (`chmod 600`):

```bash
sudo -u routario nano /opt/routario/app/.env
```

```env
# Database Connection (Direct local connection)
DATABASE_URL=postgresql+asyncpg://routario:YourStrongDbPassword@localhost:5432/routario
DB_POOL_SIZE=30
DB_MAX_OVERFLOW=60

# Redis Pub/Sub
REDIS_URL=redis://localhost:6379
ENABLE_WEBSOCKETS=true

# Security (Replace with a random 64-char key)
SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
ADMIN_USERNAME=admin
ADMIN_EMAIL=fleet-admin@yourdomain.com
ADMIN_PASSWORD=YourSecureAdminPassword

# Port Binding
API_HOST=127.0.0.1
API_PORT=8000
TCP_HOST=0.0.0.0
UDP_HOST=0.0.0.0

# History Downsampling & Retention
HISTORY_DOWNSAMPLE_ENABLED=true
HISTORY_DOWNSAMPLE_DAYS=30
HISTORY_DOWNSAMPLE_INTERVAL_SECONDS=60
HISTORY_RETENTION_ENABLED=true
HISTORY_RETENTION_DAYS=180

# Logging
LOG_LEVEL=INFO
```

Secure the environment file:

```bash
sudo chmod 600 /opt/routario/app/.env
```

---

### 7. Configure Systemd Service

Create `/etc/systemd/system/routario.service`:

```ini
[Unit]
Description=Routario Telematics Platform
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=routario
Group=routario
WorkingDirectory=/opt/routario/app
EnvironmentFile=/opt/routario/app/.env
ExecStart=/opt/routario/venv/bin/python app/main.py

# Auto-restart on crash
Restart=always
RestartSec=5s

# Increased file descriptor limit for 500+ TCP sockets
LimitNOFILE=65535
LimitNPROC=32768

# Security hardening
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=/opt/routario/app/web/uploads

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=routario

[Install]
WantedBy=multi-user.target
```

Reload systemd, enable and start Routario:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now routario
sudo systemctl status routario
```

Check live logs:

```bash
journalctl -u routario -f
```

---

### 8. Nginx Reverse Proxy with SSL/TLS & WebSockets

Install Nginx:

=== "AlmaLinux 9 / RHEL 9"

    ```bash
    sudo dnf install -y nginx certbot python3-certbot-nginx
    sudo systemctl enable --now nginx
    ```

=== "Ubuntu 22.04 / 24.04"

    ```bash
    sudo apt install -y nginx certbot python3-certbot-nginx
    sudo systemctl enable --now nginx
    ```

Create the Nginx configuration `/etc/nginx/conf.d/routario.conf` (or `/etc/nginx/sites-available/routario` on Ubuntu):

```nginx
# Map for WebSocket connection upgrading
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name tracker.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for persistent WebSockets
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Verify and restart Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Obtain a free SSL certificate with Let's Encrypt:

```bash
sudo certbot --nginx -d tracker.yourdomain.com
```

---

### 9. Firewall Configuration

Expose HTTP (80), HTTPS (443), and the Teltonika protocol port (**5027 TCP & UDP**):

=== "AlmaLinux 9 / RHEL 9 (firewalld)"

    ```bash
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --permanent --add-port=5027/tcp
    sudo firewall-cmd --permanent --add-port=5027/udp
    sudo firewall-cmd --reload
    sudo firewall-cmd --list-all
    ```

=== "Ubuntu 22.04 / 24.04 (ufw)"

    ```bash
    sudo ufw allow 22/tcp       # Ensure SSH remains accessible
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 5027/tcp
    sudo ufw allow 5027/udp
    sudo ufw enable
    sudo ufw status
    ```

---

## Teltonika FMB920 Device Configuration Guidelines

To ensure stable data delivery from 500 FMB920 trackers and prevent packet storms, configure the following parameters via the **Teltonika Configurator** or SMS commands:

### 1. GPRS / Network Settings
* **APN:** Your local cellular carrier's APN (e.g. `mnet`, `irancell`, `internet`).
* **Domain:** Your server's public IP or hostname (e.g. `tracker.yourdomain.com`).
* **Port:** `5027`
* **Protocol:** `TCP` (Highly recommended over UDP for guaranteed delivery and command ACKs).
* **Keep Alive Timeout:** `300` seconds.

### 2. Data Acquisition Profile
* **Target:** Server 1
* **Protocol:** Codec 8 or Codec 8E
* **Send Period (Moving):**
  - **Min Period:** `10` to `20` seconds.
  - **Min Distance:** `200` to `500` meters.
  - **Min Angle:** `20` to `30` degrees.
  - **Min Speed Delta:** `10` km/h.
* **Send Period (Stop / Parked):**
  - **Min Period:** `300` to `600` seconds (5 to 10 minutes).
  - This conserves vehicle battery and eliminates unnecessary database writes while parked.
* **Static Navigation:** Enable (prevents GPS drift while parked).

---

## Maintenance & Backups

### Automated PostgreSQL Backups

Set up a daily cron job to backup the Routario database:

```bash
sudo crontab -u postgres -e
```

Add:

```cron
0 2 * * * pg_dump -Fc routario > /var/backups/routario_$(date +\%F).dump
```

To restore from a backup:

```bash
sudo -u postgres pg_restore -d routario --clean --if-exists /var/backups/routario_2026-10-21.dump
```

### Application Updates

=== "Docker"

    ```bash
    cd /opt/routario
    git pull
    docker compose pull
    docker compose up -d
    ```

=== "Bare-Metal"

    ```bash
    cd /opt/routario/app
    sudo -u routario git pull
    sudo -u routario /opt/routario/venv/bin/pip install -r requirements.txt
    sudo systemctl restart routario
    ```

Routario automatically executes required database migrations on startup.
