# 🚀 Deployment Guide - RenewdLauncher Telegram Bot

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created and configured
- Bot token from @BotFather
- Environment variables ready

## 🔧 Step 1: Configure Environment Variables

### In Firebase Console:

1. Go to **Firebase Console** → **Functions** → **Configuration**
2. Add the following environment variables:

```bash
# Required Environment Variables
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-project-id.web.app/webhook
WEBHOOK_SECRET=create_random_secret_string

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

ALCHEMY_API_KEY=your_alchemy_api_key
ALCHEMY_NETWORK=sepolia
CONTRACT_ADDRESS=0xf1074ed25ea472671ddb08b5680f7b444b5e9ae3

LAUNCH_FEE_ETH=0.011
PLATFORM_PRIVATE_KEY=your_platform_private_key
PLATFORM_WALLET_ADDRESS=your_platform_wallet_address
```

### Using Firebase CLI:

```bash
firebase functions:config:set telegram.bot_token="your_bot_token"
firebase functions:config:set telegram.webhook_url="https://your-project.web.app/webhook"
firebase functions:config:set webhook.secret="your_secret"
firebase functions:config:set firebase.project_id="your_project_id"
# ... add all other variables
```

## 🚀 Step 2: Deploy Functions

```bash
# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init

# Deploy functions only (first time)
npm run deploy:functions

# Or deploy everything
npm run deploy
```

## 🔗 Step 3: Set Up Webhook

After deployment, set the webhook URL:

```bash
# Using curl
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project-id.web.app/webhook"}'

# Or using the admin endpoint
curl -X POST https://your-project-id.web.app/set-webhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project-id.web.app/webhook", "secret": "your_webhook_secret"}'
```

## 🌐 Step 4: Domain Setup (Optional)

### Custom Domain:

1. Go to **Firebase Console** → **Hosting**
2. Click **Add custom domain**
3. Follow the DNS configuration steps
4. Update webhook URL to use custom domain

## 📊 Step 5: Monitoring & Logs

### View Logs:

```bash
# Real-time logs
npm run logs

# Or via Firebase CLI
firebase functions:log --follow
```

### Health Check:

```bash
curl https://your-project-id.web.app/health
```

## 🔒 Step 6: Security Configuration

### Firestore Security Rules:

Update `firestore.rules` for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Sessions are private
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }

    // Launches are readable by creator
    match /launches/{launchId} {
      allow read: if true; // Public read for discovery
      allow write: if request.auth != null;
    }

    // Transactions are private
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Environment Security:

- Never commit `.env` files
- Use Firebase Functions config for secrets
- Rotate API keys regularly
- Monitor function invocations

## 🚨 Step 7: Production Checklist

- [ ] All environment variables configured
- [ ] Functions deployed successfully
- [ ] Webhook URL set and verified
- [ ] Firestore rules updated
- [ ] Security rules tested
- [ ] Monitoring alerts configured
- [ ] Domain configured (if using custom)
- [ ] Bot tested in production
- [ ] Error handling verified
- [ ] Backup strategy in place

## 🛠️ Common Commands

```bash
# Deploy only functions
npm run deploy:functions

# Deploy only hosting
npm run deploy:hosting

# View logs
npm run logs

# Check function status
firebase functions:list

# Delete webhook (for debugging)
curl -X POST https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook
```

## 🚨 Troubleshooting

### Bot Not Responding:

1. Check function logs: `npm run logs`
2. Verify webhook is set: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
3. Test health endpoint: `curl https://your-domain.web.app/health`

### Database Issues:

1. Check Firestore rules
2. Verify service account permissions
3. Check function environment variables

### Smart Contract Issues:

1. Verify contract address in config
2. Check Alchemy API key and network
3. Ensure sufficient ETH in platform wallet

## 📈 Scaling Considerations

### Firebase Functions Limits:

- **Timeout**: 9 minutes max (540 seconds)
- **Memory**: Up to 8GB
- **Concurrent executions**: 1000 default
- **Invocations**: 2 million free/month

### Cost Optimization:

- Use appropriate memory allocation
- Implement efficient database queries
- Cache frequently accessed data
- Monitor function cold starts

## 🔄 Updates & Maintenance

### Deploying Updates:

```bash
# Quick function update
npm run deploy:functions

# Full deployment with hosting
npm run deploy
```

### Database Maintenance:

- Regular cleanup of expired sessions
- Archive old transactions
- Monitor storage usage
- Backup critical data

## 🆘 Emergency Procedures

### Stop Bot:

```bash
# Delete webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/deleteWebhook

# Or disable function
firebase functions:config:unset telegram.bot_token
firebase deploy --only functions
```

### Rollback:

```bash
# Rollback to previous version
firebase functions:log --lines 100
# Find previous deployment
# Rollback if needed through Firebase Console
```
