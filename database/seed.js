import db from './connection.js';

db.serialize(() => {
    console.log("Setting up database tables...");

    // 1. Users table (for Login Page)
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`CREATE TABLE users (
        user_id VARCHAR PRIMARY KEY,
        email VARCHAR,
        password VARCHAR,
        name VARCHAR,
        role VARCHAR
    )`);

    db.run(`INSERT INTO users VALUES 
        ('usr-1', 'engineer@cloud.com', 'password123', 'Alex (DevOps)', 'engineer'),
        ('usr-2', 'finance@cloud.com', 'password123', 'Sarah (Finance)', 'finance'),
        ('usr-3', 'admin@cloud.com', 'password123', 'Leadership', 'leadership')
    `);

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
        network_out_mb DOUBLE
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
    let recStmt = db.prepare(`INSERT INTO recommendations VALUES (?, ?, ?, ?, ?, ?, ?)`);

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

        if (i % 3 === 0 && type === 'VM') {
            recStmt.run(
                `rec-${i}`,
                id,
                'Resize instance to smaller vCPU tier',
                'p95 CPU utilization stays below 12% over the last 30 days.',
                Math.round(cost * 0.4),
                'Low',
                'Pending'
            );
        } else if (type === 'public-ip' || type === 'block-volume') {
            recStmt.run(
                `rec-${i}`,
                id,
                'Delete orphaned resource',
                'Resource has had zero network/disk activity for over 14 days.',
                Math.round(cost * 0.8),
                'Safe',
                'Pending'
            );
        }
    }

    invStmt.finalize();
    recStmt.finalize();

    console.log("Database seeding completed successfully!");
});