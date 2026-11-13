import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os
import sys

SQLITE_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
NEON_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_1P4AZIXWjTSm@ep-late-river-az1jtwxj-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
)

def log(msg):
    print(msg, flush=True)

def run_sync():
    log("Connecting to SQLite...")
    sq_conn = sqlite3.connect(SQLITE_PATH)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()

    log("Connecting to Neon PostgreSQL...")
    pg_conn = psycopg2.connect(NEON_URL)
    pg_cur = pg_conn.cursor()

    # 1. SoilHealthStatus Mapping
    log("Checking SoilHealthStatus...")
    pg_cur.execute("SELECT status_id, status_name FROM core_soilhealthstatus")
    pg_statuses = {row[1]: row[0] for row in pg_cur.fetchall()}

    sq_cur.execute("SELECT status_id, status_name, description FROM core_soilhealthstatus")
    sq_statuses = sq_cur.fetchall()

    old_to_new_status = {}
    for s in sq_statuses:
        name = s['status_name']
        old_id = s['status_id']
        if name in pg_statuses:
            old_to_new_status[old_id] = pg_statuses[name]
        else:
            pg_cur.execute(
                "INSERT INTO core_soilhealthstatus (status_name, description) VALUES (%s, %s) RETURNING status_id",
                (name, s['description'])
            )
            new_id = pg_cur.fetchone()[0]
            pg_statuses[name] = new_id
            old_to_new_status[old_id] = new_id
    pg_conn.commit()
    log(f"Status mapping complete ({len(old_to_new_status)} statuses).")

    # 2. Farm Mapping
    pg_cur.execute("""
        SELECT f.farm_id, fm.firstname, fm.lastname 
        FROM core_farm f 
        JOIN core_farmer fm ON f.farmer_id = fm.farmer_id
    """)
    neon_farm_owners = {f"{row[1]} {row[2]}": row[0] for row in pg_cur.fetchall()}
    log(f"Neon Farm Owners: {neon_farm_owners}")

    sq_cur.execute("""
        SELECT f.farm_id, fm.firstname, fm.lastname 
        FROM core_farm f 
        JOIN core_farmer fm ON f.farmer_id = fm.farmer_id
    """)
    old_to_new_farm = {}
    for row in sq_cur.fetchall():
        owner = f"{row['firstname']} {row['lastname']}"
        old_fid = row['farm_id']
        if owner in neon_farm_owners:
            old_to_new_farm[old_fid] = neon_farm_owners[owner]
        else:
            old_to_new_farm[old_fid] = old_fid
    log(f"Farm mapping: {old_to_new_farm}")

    # 3. Fertilizer Mapping
    pg_cur.execute("SELECT fertilizer_id, fertilizer_name FROM core_fertilizer")
    neon_ferts = {row[1]: row[0] for row in pg_cur.fetchall()}
    sq_cur.execute("SELECT fertilizer_id, fertilizer_name FROM core_fertilizer")
    old_to_new_fert = {}
    for row in sq_cur.fetchall():
        fname = row['fertilizer_name']
        if fname in neon_ferts:
            old_to_new_fert[row['fertilizer_id']] = neon_ferts[fname]
    log(f"Fertilizers mapped: {len(old_to_new_fert)}")

    # 4. Fetch Readings from SQLite
    sq_cur.execute("""
        SELECT reading_id, recorded_at, nitrogen_n, phosphorus_p, potassium_k, ph_level, moisture, farm_id, status_id 
        FROM core_soilreading
        ORDER BY reading_id ASC
    """)
    readings = sq_cur.fetchall()
    log(f"Fetched {len(readings)} readings from SQLite.")

    reading_rows = []
    default_farm = list(neon_farm_owners.values())[0] if neon_farm_owners else 1
    for r in readings:
        target_farm = old_to_new_farm.get(r['farm_id'], default_farm)
        target_status = old_to_new_status.get(r['status_id'], None)
        reading_rows.append((
            r['reading_id'], r['recorded_at'], r['nitrogen_n'], r['phosphorus_p'],
            r['potassium_k'], r['ph_level'], r['moisture'], target_farm, target_status
        ))

    log("Bulk inserting 6,916 readings with execute_values...")
    insert_readings_sql = """
    INSERT INTO core_soilreading (reading_id, recorded_at, nitrogen_n, phosphorus_p, potassium_k, ph_level, moisture, farm_id, status_id)
    VALUES %s
    ON CONFLICT (reading_id) DO UPDATE SET 
        nitrogen_n = EXCLUDED.nitrogen_n,
        phosphorus_p = EXCLUDED.phosphorus_p,
        potassium_k = EXCLUDED.potassium_k,
        ph_level = EXCLUDED.ph_level,
        moisture = EXCLUDED.moisture,
        farm_id = EXCLUDED.farm_id,
        status_id = EXCLUDED.status_id;
    """
    execute_values(pg_cur, insert_readings_sql, reading_rows, page_size=1000)
    pg_conn.commit()
    log("All 6,916 readings successfully inserted/updated in Neon!")

    # 5. Fetch Recommendations from SQLite
    sq_cur.execute("""
        SELECT recommendation_id, recommended_amount_kg, generated_date, fertilizer_id, reading_id
        FROM core_recommendation
        ORDER BY recommendation_id ASC
    """)
    recs = sq_cur.fetchall()
    log(f"Fetched {len(recs)} recommendations from SQLite.")

    default_fert = list(neon_ferts.values())[0] if neon_ferts else 1
    rec_rows = []
    for r in recs:
        target_fert = old_to_new_fert.get(r['fertilizer_id'], default_fert)
        rec_rows.append((
            r['recommendation_id'], r['recommended_amount_kg'], r['generated_date'], target_fert, r['reading_id']
        ))

    log("Bulk inserting 6,916 recommendations with execute_values...")
    insert_recs_sql = """
    INSERT INTO core_recommendation (recommendation_id, recommended_amount_kg, generated_date, fertilizer_id, reading_id)
    VALUES %s
    ON CONFLICT (recommendation_id) DO UPDATE SET
        recommended_amount_kg = EXCLUDED.recommended_amount_kg,
        fertilizer_id = EXCLUDED.fertilizer_id,
        reading_id = EXCLUDED.reading_id;
    """
    execute_values(pg_cur, insert_recs_sql, rec_rows, page_size=1000)
    pg_conn.commit()
    log("All 6,916 recommendations successfully inserted/updated in Neon!")

    # 6. Reset Sequences
    log("Resetting serial sequences...")
    pg_cur.execute("SELECT setval(pg_get_serial_sequence('core_soilreading', 'reading_id'), coalesce(max(reading_id), 1)) FROM core_soilreading;")
    pg_cur.execute("SELECT setval(pg_get_serial_sequence('core_recommendation', 'recommendation_id'), coalesce(max(recommendation_id), 1)) FROM core_recommendation;")
    pg_cur.execute("SELECT setval(pg_get_serial_sequence('core_soilhealthstatus', 'status_id'), coalesce(max(status_id), 1)) FROM core_soilhealthstatus;")
    pg_conn.commit()

    sq_conn.close()
    pg_conn.close()
    log("COMPLETE: All 6,916 historical records are now in Neon PostgreSQL!")

if __name__ == '__main__':
    run_sync()
