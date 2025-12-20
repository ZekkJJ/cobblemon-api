# MongoDB Data Migration Script
# Migrates ALL data from MongoDB Atlas to Oracle Cloud

Write-Host "🔄 MongoDB Migration: Atlas → Oracle Cloud" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Connection strings
$SOURCE_URI = "mongodb+srv://Vercel-Admin-cobblemon22:NdDIdiFDHnD228kY@cobblemon22.seemexn.mongodb.net/"
$SOURCE_DB = "cobblemon"
$TARGET_URI = "mongodb://ADMIN:9XMsZKF34EAVeSRW@G3CF75C71B99C87-OP9QWIYLW1WNEBAB.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=`$external&ssl=true&retryWrites=false&loadBalanced=true"
$TARGET_DB = "admin"
$BACKUP_DIR = "./mongodb_backup"

# Step 1: Check if mongodump/mongorestore are installed
Write-Host "📋 Checking MongoDB tools..." -ForegroundColor Yellow
try {
    $null = Get-Command mongodump -ErrorAction Stop
    $null = Get-Command mongorestore -ErrorAction Stop
    Write-Host "✅ MongoDB tools found" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB tools not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MongoDB Database Tools:" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/try/download/database-tools" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use MongoDB Compass (GUI method - easier!):" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/products/compass" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Step 2: Export from Atlas
Write-Host "📦 Exporting data from MongoDB Atlas..." -ForegroundColor Yellow
Write-Host "   Database: $SOURCE_DB" -ForegroundColor Gray

if (Test-Path $BACKUP_DIR) {
    Write-Host "   Removing old backup..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $BACKUP_DIR
}

try {
    mongodump --uri="$SOURCE_URI" --db=$SOURCE_DB --out=$BACKUP_DIR
    if ($LASTEXITCODE -ne 0) {
        throw "mongodump failed"
    }
    Write-Host "✅ Export completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Export failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Count collections
$collections = Get-ChildItem -Path "$BACKUP_DIR/$SOURCE_DB" -Filter "*.bson" | Measure-Object
Write-Host "📊 Found $($collections.Count) collections to migrate" -ForegroundColor Cyan

Write-Host ""

# Step 4: Import to Oracle Cloud
Write-Host "📥 Importing data to Oracle Cloud..." -ForegroundColor Yellow
Write-Host "   Database: $TARGET_DB" -ForegroundColor Gray

try {
    mongorestore --uri="$TARGET_URI" --db=$TARGET_DB "$BACKUP_DIR/$SOURCE_DB" --drop
    if ($LASTEXITCODE -ne 0) {
        throw "mongorestore failed"
    }
    Write-Host "✅ Import completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Import failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tip: Check if Oracle Cloud allows connections from your IP" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Source: MongoDB Atlas ($SOURCE_DB)" -ForegroundColor Gray
Write-Host "   Target: Oracle Cloud ($TARGET_DB)" -ForegroundColor Gray
Write-Host "   Collections: $($collections.Count)" -ForegroundColor Gray
Write-Host ""
Write-Host "🧹 Cleanup backup? (Y/N): " -ForegroundColor Yellow -NoNewline
$cleanup = Read-Host

if ($cleanup -eq "Y" -or $cleanup -eq "y") {
    Remove-Item -Recurse -Force $BACKUP_DIR
    Write-Host "✅ Backup cleaned up" -ForegroundColor Green
} else {
    Write-Host "💾 Backup kept at: $BACKUP_DIR" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 All done! Your data is now in Oracle Cloud." -ForegroundColor Green
