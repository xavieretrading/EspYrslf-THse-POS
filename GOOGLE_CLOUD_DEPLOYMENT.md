# Google Cloud Deployment Guide for POS System

## Prerequisites
1. Google Cloud Project created and you have Owner access
2. `gcloud` CLI installed and authenticated
3. Billing enabled on your Google Cloud Project

## Step 1: Setup Cloud SQL (Database Migration)

### Create a Cloud SQL Instance
```bash
gcloud sql instances create pos-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --no-backup
```

### Create Database and User
```bash
# Connect to Cloud SQL
gcloud sql connect pos-db

# In the PostgreSQL prompt:
CREATE DATABASE pos_system;
CREATE USER pos_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE pos_system TO pos_user;
```

### Import Schema from Supabase
1. Export your Supabase database:
   ```bash
   pg_dump -h [your-supabase-host] -U postgres -d postgres > backup.sql
   ```

2. Import to Cloud SQL:
   ```bash
   gcloud sql import sql pos-db backup.sql \
     --database=pos_system
   ```

## Step 2: Configure kkEnvironment Variables in Cloud

### Using Cloud Secret Manager (Recommended)
```bash
# Store sensitive data
echo -n "YOUR_DATABASE_PASSWORD" | gcloud secrets create db-password --data-file=-
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
```

### Create .env.cloud file
Create a `.env.cloud` file (not committed to git):
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
DATABASE_URL=postgresql://pos_user:PASSWORD@/pos_system?cloudSqlInstance=PROJECT:us-central1:pos-db&user=pos_user&password=PASSWORD
GEMINI_API_KEY=your_gemini_key
NODE_ENV=production
TZ=Asia/Manila
```

## Step 3: Deploy to App Engine

### Initialize App Engine (first time only)
```bash
gcloud app create --region=us-central1
```

### Deploy
```bash
# From the POSALLSET directory
gcloud app deploy app.yaml --promote --quiet
```

### View logs
```bash
gcloud app logs read -n 100
```

### Access your app
```bash
gcloud app browse
```

## Step 4: Enable Required APIs

```bash
gcloud services enable \
  appengine.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com \
  storage-api.googleapis.com
```

## Step 5: Configure Cloud Build (Optional - for CI/CD)

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Troubleshooting

### Check Deployment Status
```bash
gcloud app describe
```

### View Real-time Logs
```bash
gcloud app logs read -n 50 --tail
```

### Rollback to Previous Version
```bash
gcloud app versions list
gcloud app versions traffic --split-by=random [VERSION_ID]
```

### Database Connection Issues
```bash
gcloud sql instances describe pos-db
gcloud sql instances patch pos-db --require-ssl
```

## Cost Optimization Tips
- Use `db-f1-micro` tier for low traffic (cheaper)
- Set `max_instances: 5` in app.yaml to prevent cost spikes
- Enable Cloud SQL Proxy for better connection management
- Use Cloud CDN for static assets

## Next Steps After Deployment
1. Set up monitoring: `gcloud monitoring dashboards create`
2. Configure Cloud Logging: `gcloud logging sinks create`
3. Setup automatic backups: `gcloud sql backups create`
4. Enable Cloud Armor for DDoS protection

## Rollback Procedure
If something goes wrong after deployment:
```bash
gcloud app versions list
gcloud app versions traffic --split-by=version --promote [PREVIOUS_VERSION]
```

---
**Note:** Update `app.yaml` with your actual environment variables before deploying. Never commit `.env` files to git.
