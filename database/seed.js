import db, { importGeneratedData } from './connection.js';

db.serialize(() => {
    console.log("Setting up database tables...");

    // 1. Users table (for Login Page)
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`CREATE TABLE users (
        user_id VARCHAR PRIMARY KEY,
        email VARCHAR,
        password VARCHAR,
        name VARCHAR,
        role VARCHAR,
        is_admin BOOLEAN DEFAULT FALSE
    )`);

    db.run(`INSERT INTO users VALUES 
        ('usr-1', 'engineer@cloud.com', 'password123', 'Alex (DevOps)', 'engineer', FALSE),
        ('usr-2', 'finance@cloud.com', 'password123', 'Sarah (Finance)', 'finance', FALSE),
        ('usr-3', 'admin@cloud.com', 'password123', 'Leadership', 'leadership', TRUE)
    `);

    db.run(`DROP TABLE IF EXISTS company_settings`);
    db.run(`CREATE TABLE company_settings (
        company_id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        website VARCHAR NOT NULL,
        industry VARCHAR NOT NULL,
        contact_email VARCHAR NOT NULL,
        address VARCHAR NOT NULL
    )`);
    db.run(`INSERT INTO company_settings VALUES ('default', 'Your Company', '', '', '', '')`);

    // 2. Inventory table (VMs, Block Volumes, Public IPs)
    db.run(`DROP TABLE IF EXISTS inventory`);
    db.run(`CREATE TABLE inventory (
        resource_id VARCHAR PRIMARY KEY,
        name VARCHAR,
        type VARCHAR,
        region VARCHAR,
        environment VARCHAR,
        owner VARCHAR,
        vcpu INT,
        ram_gb INT,
        disk_size_gb INT,
        monthly_cost DOUBLE,
        creation_date VARCHAR
    )`);

    // 3. Metrics table (30 days of utilization data)
    db.run(`DROP TABLE IF EXISTS metrics`);
    db.run(`CREATE TABLE metrics (
        resource_id VARCHAR,
        timestamp VARCHAR,
        cpu_pct DOUBLE,
        memory_pct DOUBLE,
        disk_pct DOUBLE,
        network_in_mb DOUBLE,
        network_out_mb DOUBLE,
        is_anomaly VARCHAR DEFAULT 'false'
    )`);

    // 4. Recommendations table (Rightsizing & Cost Optimization)
    db.run(`DROP TABLE IF EXISTS recommendations`);
    db.run(`CREATE TABLE recommendations (
        rec_id VARCHAR PRIMARY KEY,
        resource_id VARCHAR,
        action VARCHAR,
        reason VARCHAR,
        estimated_monthly_saving DOUBLE,
        risk_level VARCHAR,
        status VARCHAR
    )`);

    console.log("Tables created successfully. Seeding data...");

    const regions = ['Noida', 'Bangalore', 'Mumbai'];
    const environments = ['prod', 'staging', 'dev'];
    const teams = ['Core-Eng', 'Payments', 'Analytics', 'Growth', 'Infra'];
    const vcpuOptions = [2, 4, 8, 16, 32];
    
    let invStmt = db.prepare(`INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`); 

    for (let i = 1; i <= 100; i++) {
        const id = `vm-cluster-${1000 + i}`;
        const name = `instance-${i}-${environments[i % environments.length]}`;
        const type = i % 10 === 0 ? 'block-volume' : (i % 15 === 0 ? 'public-ip' : 'VM');
        const region = regions[i % regions.length];
        const env = environments[i % environments.length];
        const owner = teams[i % teams.length];
        const vcpu = vcpuOptions[i % vcpuOptions.length];
        const ram = vcpu * 2;
        const disk = vcpu * 20;
        const cost = vcpu * 35.5;

        invStmt.run(id, name, type, region, env, owner, vcpu, ram, disk, cost, '2025-10-01');

    }

    invStmt.finalize((inventoryError) => {
        if (inventoryError) {
            console.error("Inventory seed finalization failed:", inventoryError);
            process.exitCode = 1;
            db.close();
            return;
        }
        void (async () => {
            try {
                const result = await importGeneratedData({ force: true });
                console.log(
                    `Imported simulator data: ${result.resourceCount} resources and ${result.metricCount} metrics.`,
                );
                console.log("Database seeding completed successfully!");
            } catch (error) {
                console.error("Generated data import failed:", error);
                process.exitCode = 1;
            } finally {
                db.close();
            }
        })();
    });
});