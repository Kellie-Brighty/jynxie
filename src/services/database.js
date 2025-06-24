const admin = require("firebase-admin");
const { config } = require("../../config");

class DatabaseService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail,
        }),
        databaseURL: `https://${config.firebase.projectId}.firebaseio.com`,
      });
    }

    this.db = admin.firestore();
    console.log("✅ Database service initialized");
  }

  // User Management
  async createUser(telegramId, userData) {
    try {
      const userRef = this.db
        .collection(config.collections.users)
        .doc(telegramId.toString());

      const user = {
        telegramId,
        username: userData.username || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        wallet: userData.wallet,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalLaunches: 0,
        totalSpent: "0",
        isActive: true,
      };

      await userRef.set(user);
      console.log(`✅ User created: ${telegramId}`);
      return user;
    } catch (error) {
      console.error("❌ Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async getUser(telegramId) {
    try {
      const userDoc = await this.db
        .collection(config.collections.users)
        .doc(telegramId.toString())
        .get();

      if (!userDoc.exists) {
        return null;
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error("❌ Error getting user:", error);
      throw new Error("Failed to get user");
    }
  }

  async updateUser(telegramId, updates) {
    try {
      const userRef = this.db
        .collection(config.collections.users)
        .doc(telegramId.toString());

      await userRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ User updated: ${telegramId}`);
    } catch (error) {
      console.error("❌ Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  async updateUserBalance(telegramId, balance) {
    try {
      await this.updateUser(telegramId, { "wallet.balance": balance });
    } catch (error) {
      console.error("❌ Error updating user balance:", error);
      throw new Error("Failed to update balance");
    }
  }

  // Session Management
  async createSession(telegramId, sessionData) {
    try {
      const sessionRef = this.db.collection(config.collections.sessions).doc();

      const session = {
        id: sessionRef.id,
        telegramId,
        type: sessionData.type,
        state: sessionData.state || "started",
        data: sessionData.data || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + config.bot.sessionTimeout),
      };

      await sessionRef.set(session);
      console.log(`✅ Session created: ${sessionRef.id}`);
      return session;
    } catch (error) {
      console.error("❌ Error creating session:", error);
      throw new Error("Failed to create session");
    }
  }

  async getActiveSession(telegramId, type = null) {
    try {
      let query = this.db
        .collection(config.collections.sessions)
        .where("telegramId", "==", telegramId)
        .where("expiresAt", ">", new Date())
        .orderBy("expiresAt", "desc")
        .limit(1);

      if (type) {
        query = query.where("type", "==", type);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error("❌ Error getting active session:", error);
      return null;
    }
  }

  async updateSession(sessionId, updates) {
    try {
      const sessionRef = this.db
        .collection(config.collections.sessions)
        .doc(sessionId);

      await sessionRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Session updated: ${sessionId}`);
    } catch (error) {
      console.error("❌ Error updating session:", error);
      throw new Error("Failed to update session");
    }
  }

  async endSession(sessionId) {
    try {
      await this.updateSession(sessionId, {
        state: "completed",
        expiresAt: new Date(),
      });

      console.log(`✅ Session ended: ${sessionId}`);
    } catch (error) {
      console.error("❌ Error ending session:", error);
      throw new Error("Failed to end session");
    }
  }

  // Launch Management
  async createLaunch(launchData) {
    try {
      const launchRef = this.db.collection(config.collections.launches).doc();

      const launch = {
        id: launchRef.id,
        telegramId: launchData.telegramId,
        tokenName: launchData.tokenName,
        tokenSymbol: launchData.tokenSymbol,
        metadata: launchData.metadata,
        tokenAddress: launchData.tokenAddress || null,
        txHash: launchData.txHash || null,
        status: launchData.status || "pending",
        ethAmount: launchData.ethAmount || "0",
        gasUsed: launchData.gasUsed || null,
        blockNumber: launchData.blockNumber || null,
        error: launchData.error || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await launchRef.set(launch);
      console.log(`✅ Launch record created: ${launchRef.id}`);
      return launch;
    } catch (error) {
      console.error("❌ Error creating launch:", error);
      throw new Error("Failed to create launch");
    }
  }

  async updateLaunch(launchId, updates) {
    try {
      const launchRef = this.db
        .collection(config.collections.launches)
        .doc(launchId);

      await launchRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Launch updated: ${launchId}`);
    } catch (error) {
      console.error("❌ Error updating launch:", error);
      throw new Error("Failed to update launch");
    }
  }

  async getUserLaunches(telegramId, limit = 10) {
    try {
      const snapshot = await this.db
        .collection(config.collections.launches)
        .where("telegramId", "==", telegramId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const launches = [];
      snapshot.forEach((doc) => {
        launches.push({ id: doc.id, ...doc.data() });
      });

      return launches;
    } catch (error) {
      console.error("❌ Error getting user launches:", error);
      return [];
    }
  }

  async getRecentLaunches(limit = 20) {
    try {
      const snapshot = await this.db
        .collection(config.collections.launches)
        .where("status", "==", "success")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const launches = [];
      snapshot.forEach((doc) => {
        launches.push({ id: doc.id, ...doc.data() });
      });

      return launches;
    } catch (error) {
      console.error("❌ Error getting recent launches:", error);
      return [];
    }
  }

  // Transaction Management
  async createTransaction(transactionData) {
    try {
      const txRef = this.db.collection(config.collections.transactions).doc();

      const transaction = {
        id: txRef.id,
        telegramId: transactionData.telegramId,
        type: transactionData.type, // 'deposit', 'launch', 'withdrawal'
        amount: transactionData.amount,
        txHash: transactionData.txHash || null,
        status: transactionData.status || "pending",
        fromAddress: transactionData.fromAddress || null,
        toAddress: transactionData.toAddress || null,
        gasUsed: transactionData.gasUsed || null,
        blockNumber: transactionData.blockNumber || null,
        error: transactionData.error || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await txRef.set(transaction);
      console.log(`✅ Transaction record created: ${txRef.id}`);
      return transaction;
    } catch (error) {
      console.error("❌ Error creating transaction:", error);
      throw new Error("Failed to create transaction");
    }
  }

  async updateTransaction(transactionId, updates) {
    try {
      const txRef = this.db
        .collection(config.collections.transactions)
        .doc(transactionId);

      await txRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Transaction updated: ${transactionId}`);
    } catch (error) {
      console.error("❌ Error updating transaction:", error);
      throw new Error("Failed to update transaction");
    }
  }

  async getUserTransactions(telegramId, limit = 10) {
    try {
      const snapshot = await this.db
        .collection(config.collections.transactions)
        .where("telegramId", "==", telegramId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const transactions = [];
      snapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });

      return transactions;
    } catch (error) {
      console.error("❌ Error getting user transactions:", error);
      return [];
    }
  }

  // Analytics
  async getUserStats(telegramId) {
    try {
      const user = await this.getUser(telegramId);
      if (!user) return null;

      const [launches, transactions] = await Promise.all([
        this.getUserLaunches(telegramId, 100),
        this.getUserTransactions(telegramId, 100),
      ]);

      const successfulLaunches = launches.filter(
        (l) => l.status === "success"
      ).length;
      const totalSpent = transactions
        .filter((t) => t.type === "launch" && t.status === "success")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      return {
        totalLaunches: launches.length,
        successfulLaunches,
        totalSpent: totalSpent.toString(),
        totalTransactions: transactions.length,
        joinedAt: user.createdAt,
      };
    } catch (error) {
      console.error("❌ Error getting user stats:", error);
      return null;
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions() {
    try {
      const expiredSessions = await this.db
        .collection(config.collections.sessions)
        .where("expiresAt", "<", new Date())
        .get();

      const batch = this.db.batch();
      expiredSessions.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Cleaned up ${expiredSessions.size} expired sessions`);
    } catch (error) {
      console.error("❌ Error cleaning up sessions:", error);
    }
  }
}

module.exports = DatabaseService;
