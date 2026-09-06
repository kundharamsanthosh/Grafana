# Loki + Grafana Detailed Guide for Playwright

Project path:

```text
C:\Automation\DemoblazeGrafanaPractice
```

This guide explains how to integrate **Loki + Grafana** with the Demoblaze Playwright project.

The main idea:

```text
Playwright runs tests
Playwright output is saved into a log file
Promtail reads the log file
Promtail sends logs to Loki
Grafana reads logs from Loki
You view and search logs in Grafana
```

## 1. What Is Loki?

Loki is a log aggregation tool from Grafana Labs.

It is used to store and search logs.

In automation testing, Loki can help you see:

```text
Which tests passed
Which tests failed
Error messages
Execution logs
Stack traces
Console output
Debug information
```

## 2. What Is Grafana?

Grafana is a dashboard and visualization tool.

Grafana connects to Loki and shows logs in a readable way.

With Grafana, you can:

```text
Search Playwright logs
Filter failed tests
Create dashboards
Create alert rules
Share dashboards with team
Debug failures faster
```

## 3. What Is Promtail?

Promtail is an agent that sends logs to Loki.

Promtail watches a log file such as:

```text
logs/playwright-test.log
```

Then it sends the log lines to Loki.

Flow:

```text
logs/playwright-test.log
        ↓
     Promtail
        ↓
       Loki
        ↓
     Grafana
```

## 4. Why Use Loki for Playwright?

Playwright already shows test results in terminal.

But after execution is finished, terminal output may be lost.

Loki helps store that output.

Example Playwright output:

```text
Running 4 tests using 1 worker

ok 1 [chromium] tests\demoblaze.spec.ts:8:7 loads home page and shows products
ok 2 [chromium] tests\demoblaze.spec.ts:17:7 filters laptop category
ok 3 [chromium] tests\demoblaze.spec.ts:26:7 shows error for invalid login
ok 4 [chromium] tests\demoblaze.spec.ts:35:7 adds product to cart and places order

4 passed
```

After sending this to Loki, you can search it in Grafana.

## 5. Required Tools

You need:

```text
Node.js
Playwright project
Docker Desktop
Grafana
Loki
Promtail
```

Docker Desktop is required because Loki, Promtail, and Grafana will run as Docker containers.

Check Docker:

```powershell
docker --version
```

Check Docker Compose:

```powershell
docker compose version
```

If these commands fail, install Docker Desktop first.

## 6. Recommended Folder Structure

Later, add these folders and files:

```text
DemoblazeGrafanaPractice/
  pages/
  tests/
  logs/
    playwright-test.log
  loki/
    loki-config.yml
  promtail/
    promtail-config.yml
  grafana/
    provisioning/
      datasources/
        loki.yml
  docker-compose.yml
```

Purpose of each item:

```text
logs/playwright-test.log       Stores Playwright terminal output
loki/loki-config.yml           Loki server configuration
promtail/promtail-config.yml   Promtail log shipping configuration
grafana/provisioning/...       Automatically configures Loki datasource
docker-compose.yml             Starts Loki, Promtail, and Grafana
```

## 7. Step 1: Create Logs Folder

Create a folder:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
New-Item -ItemType Directory -Force logs
```

This folder will store Playwright logs.

## 8. Step 2: Run Playwright and Save Output to Log File

Run all tests and save output:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm test *> logs/playwright-test.log
```

Run headed tests and save output:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm run test:headed *> logs/playwright-test.log
```

Important:

```text
*> means redirect all output to the log file in PowerShell.
```

After running the command, open:

```text
logs/playwright-test.log
```

You should see test output.

Example:

```text
Running 4 tests using 1 worker
ok 1 [chromium] tests\demoblaze.spec.ts:8:7 loads home page and shows products @smoke
ok 2 [chromium] tests\demoblaze.spec.ts:17:7 filters laptop category @regression
ok 3 [chromium] tests\demoblaze.spec.ts:26:7 shows error for invalid login @negative
ok 4 [chromium] tests\demoblaze.spec.ts:35:7 adds product to cart and places order @e2e
4 passed
```

## 9. Step 3: Example Loki Config

Create:

```text
loki/loki-config.yml
```

Example content:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

limits_config:
  allow_structured_metadata: false
```

Meaning:

```text
auth_enabled: false       No login required for local Loki
http_listen_port: 3100    Loki runs on port 3100
filesystem storage        Logs are stored inside container filesystem
replication_factor: 1     Local single-node setup
```

## 10. Step 4: Example Promtail Config

Create:

```text
promtail/promtail-config.yml
```

Example content:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: playwright-demoblaze
    static_configs:
      - targets:
          - localhost
        labels:
          job: playwright
          project: demoblaze
          __path__: /var/log/playwright/*.log
```

Meaning:

```text
clients.url              Loki push endpoint
job                      Main label used in LogQL
project                  Project label used for filtering
__path__                 Log file path inside Promtail container
```

## 11. Step 5: Example Grafana Loki Datasource

Create:

```text
grafana/provisioning/datasources/loki.yml
```

Example content:

```yaml
apiVersion: 1

datasources:
  - name: Loki
    uid: loki
    type: loki
    access: proxy
    url: http://loki:3100
    isDefault: true
    editable: true
```

Meaning:

```text
name: Loki               Data source name in Grafana
type: loki               Grafana knows this is a Loki datasource
url: http://loki:3100    Docker service name and Loki port
isDefault: true          Grafana uses Loki by default
```

## 12. Step 6: Example Docker Compose

Create:

```text
docker-compose.yml
```

Example content:

```yaml
services:
  loki:
    image: grafana/loki:3.2.1
    container_name: demoblaze-loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/loki-config.yml
    volumes:
      - ./loki/loki-config.yml:/etc/loki/loki-config.yml:ro

  promtail:
    image: grafana/promtail:3.2.1
    container_name: demoblaze-promtail
    command: -config.file=/etc/promtail/promtail-config.yml
    volumes:
      - ./promtail/promtail-config.yml:/etc/promtail/promtail-config.yml:ro
      - ./logs:/var/log/playwright:ro
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:11.3.1
    container_name: demoblaze-grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_DEFAULT_THEME: light
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    depends_on:
      - loki
```

Meaning:

```text
loki service        Stores logs
promtail service    Reads logs and sends to Loki
grafana service     Displays logs from Loki
```

## 13. Step 7: Start Loki and Grafana

Run:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
docker compose up -d
```

Check containers:

```powershell
docker ps
```

Expected containers:

```text
demoblaze-loki
demoblaze-promtail
demoblaze-grafana
```

## 14. Step 8: Generate Playwright Logs

Run:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm test *> logs/playwright-test.log
```

Promtail should read this file and send logs to Loki.

## 15. Step 9: Open Grafana

Open:

```text
http://localhost:3000
```

Login:

```text
username: admin
password: admin
```

If Grafana asks to change password, you can skip for local practice.

## 16. Step 10: Verify Loki Datasource

In Grafana:

```text
Connections
Data sources
Loki
Save & test
```

Expected message:

```text
Data source connected and labels found
```

## 17. Step 11: Query Logs in Grafana Explore

Go to:

```text
Explore
```

Select:

```text
Loki
```

Query all Playwright logs:

```logql
{job="playwright"}
```

Query Demoblaze logs:

```logql
{job="playwright", project="demoblaze"}
```

Search passed tests:

```logql
{job="playwright", project="demoblaze"} |= "passed"
```

Search failed tests:

```logql
{job="playwright", project="demoblaze"} |= "failed"
```

Search errors:

```logql
{job="playwright", project="demoblaze"} |= "Error"
```

Search one test:

```logql
{job="playwright", project="demoblaze"} |= "adds product to cart"
```

Search only Chromium logs:

```logql
{job="playwright", project="demoblaze"} |= "chromium"
```

## 18. Step 12: Create Dashboard Panels

In Grafana:

```text
Dashboards
New
New dashboard
Add visualization
Select Loki
```

### Panel 1: All Playwright Logs

Panel title:

```text
All Playwright Logs
```

Query:

```logql
{job="playwright", project="demoblaze"}
```

Visualization:

```text
Logs
```

### Panel 2: Failed Test Logs

Panel title:

```text
Failed Test Logs
```

Query:

```logql
{job="playwright", project="demoblaze"} |= "failed"
```

Visualization:

```text
Logs
```

### Panel 3: Error Logs

Panel title:

```text
Error Logs
```

Query:

```logql
{job="playwright", project="demoblaze"} |= "Error"
```

Visualization:

```text
Logs
```

### Panel 4: Passed Test Logs

Panel title:

```text
Passed Test Logs
```

Query:

```logql
{job="playwright", project="demoblaze"} |= "passed"
```

Visualization:

```text
Logs
```

## 19. Useful LogQL Queries

All logs:

```logql
{job="playwright"}
```

Filter by project:

```logql
{job="playwright", project="demoblaze"}
```

Contains text:

```logql
{job="playwright"} |= "passed"
```

Does not contain text:

```logql
{job="playwright"} != "passed"
```

Regex search:

```logql
{job="playwright"} |~ "failed|Error|Timeout"
```

Case-sensitive error search:

```logql
{job="playwright"} |= "Error"
```

Count log lines over time:

```logql
count_over_time({job="playwright"}[5m])
```

Count errors over time:

```logql
count_over_time({job="playwright"} |= "Error" [5m])
```

Count failures over time:

```logql
count_over_time({job="playwright"} |= "failed" [5m])
```

## 20. Alert Example

You can create an alert when failed logs appear.

Query:

```logql
count_over_time({job="playwright", project="demoblaze"} |= "failed" [5m])
```

Condition:

```text
WHEN query is above 0
```

Meaning:

```text
If any failed test log appears in the last 5 minutes, trigger alert.
```

## 21. Full Run Order

Terminal 1:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
docker compose up -d
```

Terminal 2:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
New-Item -ItemType Directory -Force logs
npm test *> logs/playwright-test.log
```

Browser:

```text
http://localhost:3000
```

Grafana Explore query:

```logql
{job="playwright", project="demoblaze"}
```

## 22. How To Practice

Practice 1:

```text
Run tests
Open Grafana Explore
Search all logs
```

Practice 2:

```text
Run tests in headed mode
Save output to logs/playwright-test.log
Search for "passed"
```

Practice 3:

```text
Make one test fail intentionally
Run tests again
Search for "failed"
```

Practice 4:

```text
Create a dashboard panel for all logs
Create a dashboard panel for failed logs
Create a dashboard panel for error logs
```

Practice 5:

```text
Create an alert when failed logs are found
```

## 23. Common Issues and Fixes

### Issue 1: Grafana Opens but No Logs Show

Check if log file exists:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
Get-Content logs\playwright-test.log
```

If the file is empty, run:

```powershell
npm test *> logs/playwright-test.log
```

### Issue 2: Loki Datasource Fails

Check containers:

```powershell
docker ps
```

Check Loki logs:

```powershell
docker logs demoblaze-loki
```

### Issue 3: Promtail Is Not Sending Logs

Check Promtail logs:

```powershell
docker logs demoblaze-promtail
```

Check this path exists:

```text
logs/playwright-test.log
```

Check Promtail config:

```yaml
__path__: /var/log/playwright/*.log
```

Check Docker volume:

```yaml
- ./logs:/var/log/playwright:ro
```

### Issue 4: Docker Command Not Found

Run:

```powershell
docker --version
```

If it fails:

```text
Install Docker Desktop
Restart terminal
Start Docker Desktop
```

### Issue 5: No Labels Found in Grafana

Run tests again:

```powershell
npm test *> logs/playwright-test.log
```

Restart Promtail:

```powershell
docker restart demoblaze-promtail
```

Then try:

```logql
{job="playwright"}
```

## 24. Loki vs Prometheus

Loki is for logs:

```text
Error messages
Text search
Stack traces
Execution output
Debugging failures
```

Prometheus is for metrics:

```text
Total tests
Passed count
Failed count
Pass percentage
Execution duration
Trends
```

For first practice, use:

```text
Loki + Grafana
```

For company-style monitoring, use:

```text
Loki + Prometheus + Grafana
```

## 25. Learning Checklist

```text
[ ] I understand what Loki does
[ ] I understand what Grafana does
[ ] I understand what Promtail does
[ ] I can save Playwright output into a log file
[ ] I can start Loki using Docker
[ ] I can start Grafana using Docker
[ ] I can configure Loki datasource in Grafana
[ ] I can query logs using LogQL
[ ] I can filter failed test logs
[ ] I can create a logs dashboard
[ ] I can create a failure alert
```

## 26. Current Playwright Commands

Run all tests:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm test
```

Run headed:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npm run test:headed
```

Run debug:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
npx playwright test --config=playwright.config.ts --debug
```

Run and save log:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
New-Item -ItemType Directory -Force logs
npm test *> logs/playwright-test.log
```
