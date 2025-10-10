/**
 * Enterprise Security Manager
 * Comprehensive security features for the Laravel Accounting Platform
 */

import { performanceMonitor as _performanceMonitor } from '../analytics/PerformanceMonitor';
import { socketManager } from '../socket/socketManager';

// Security event types
export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'suspicious_activity' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  timestamp: Date;
  details: Record<string, any>;
  blocked: boolean;
  resolved: boolean;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  type: 'rate_limit' | 'ip_whitelist' | 'data_access' | 'session_timeout' | 'password_policy';
  enabled: boolean;
  config: Record<string, any>;
  organizationId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityMetrics {
  totalEvents: number;
  blockedAttempts: number;
  suspiciousActivities: number;
  policyViolations: number;
  activeThreats: number;
  riskScore: number;
  lastIncident?: Date;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface SessionConfig {
  maxAge: number;
  maxConcurrentSessions: number;
  requireReauth: boolean;
  idleTimeout: number;
}

/**
 * Security Manager Class
 * Handles authentication, authorization, and security monitoring
 */
class SecurityManager {
  private events: SecurityEvent[] = [];
  private policies: Map<string, SecurityPolicy> = new Map();
  private rateLimiters: Map<string, any> = new Map();
  private activeSessions: Map<string, any> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private blockedIPs: Set<string> = new Set();
  private securityMetrics: SecurityMetrics = {
    totalEvents: 0,
    blockedAttempts: 0,
    suspiciousActivities: 0,
    policyViolations: 0,
    activeThreats: 0,
    riskScore: 0,
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize security manager
   */
  private initialize(): void {
    this.setupDefaultPolicies();
    this.setupEventListeners();
    this.startSecurityMonitoring();
    
    console.log('🔒 Security Manager initialized');
  }

  /**
   * Setup default security policies
   */
  private setupDefaultPolicies(): void {
    // Rate limiting policy
    this.addPolicy({
      id: 'default-rate-limit',
      name: 'Default Rate Limiting',
      type: 'rate_limit',
      enabled: true,
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        skipSuccessfulRequests: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Session timeout policy
    this.addPolicy({
      id: 'session-timeout',
      name: 'Session Timeout',
      type: 'session_timeout',
      enabled: true,
      config: {
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        idleTimeout: 30 * 60 * 1000, // 30 minutes
        maxConcurrentSessions: 3,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Password policy
    this.addPolicy({
      id: 'password-policy',
      name: 'Password Policy',
      type: 'password_policy',
      enabled: true,
      config: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Setup security event listeners
   */
  private setupEventListeners(): void {
    // Listen for authentication events
    document.addEventListener('auth:login', (event: any) => {
      this.recordSecurityEvent({
        type: 'authentication',
        severity: 'low',
        action: 'login',
        details: event.detail,
        blocked: false,
      });
    });

    document.addEventListener('auth:logout', (event: any) => {
      this.recordSecurityEvent({
        type: 'authentication',
        severity: 'low',
        action: 'logout',
        details: event.detail,
        blocked: false,
      });
    });

    document.addEventListener('auth:failed', (event: any) => {
      this.recordSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        action: 'login_failed',
        details: event.detail,
        blocked: true,
      });
    });

    // Listen for data access events
    document.addEventListener('data:access', (event: any) => {
      this.recordSecurityEvent({
        type: 'data_access',
        severity: 'low',
        resource: event.detail.resource,
        action: event.detail.action,
        details: event.detail,
        blocked: false,
      });
    });

    // Listen for suspicious activities
    document.addEventListener('security:suspicious', (event: any) => {
      this.recordSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        details: event.detail,
        blocked: true,
      });
    });
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Monitor for suspicious patterns
    setInterval(() => {
      this.detectSuspiciousPatterns();
      this.updateSecurityMetrics();
      this.cleanupOldEvents();
    }, 60000); // Every minute

    // Monitor session timeouts
    setInterval(() => {
      this.checkSessionTimeouts();
    }, 30000); // Every 30 seconds

    // Send security metrics to server
    setInterval(() => {
      this.reportSecurityMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Add security policy
   */
  addPolicy(policy: SecurityPolicy): void {
    this.policies.set(policy.id, policy);
    
    // Apply policy immediately
    this.applyPolicy(policy);
    
    console.log(`🔒 Security policy added: ${policy.name}`);
  }

  /**
   * Apply security policy
   */
  private applyPolicy(policy: SecurityPolicy): void {
    if (!policy.enabled) return;

    switch (policy.type) {
      case 'rate_limit':
        this.setupRateLimit(policy.id, policy.config as RateLimitConfig);
        break;
      case 'session_timeout':
        this.setupSessionTimeout(policy.config as SessionConfig);
        break;
      case 'ip_whitelist':
        this.setupIPWhitelist(policy.config.allowedIPs);
        break;
    }
  }

  /**
   * Setup rate limiting
   */
  private setupRateLimit(policyId: string, config: RateLimitConfig): void {
    const rateLimiter = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      requests: new Map<string, { count: number; resetTime: number }>(),
    };

    this.rateLimiters.set(policyId, rateLimiter);
  }

  /**
   * Check rate limit
   */
  checkRateLimit(key: string, policyId: string = 'default-rate-limit'): boolean {
    const rateLimiter = this.rateLimiters.get(policyId);
    if (!rateLimiter) return true;

    const now = Date.now();
    const userRequests = rateLimiter.requests.get(key) || { count: 0, resetTime: now + rateLimiter.windowMs };

    // Reset if window has passed
    if (now > userRequests.resetTime) {
      userRequests.count = 0;
      userRequests.resetTime = now + rateLimiter.windowMs;
    }

    userRequests.count++;
    rateLimiter.requests.set(key, userRequests);

    const allowed = userRequests.count <= rateLimiter.maxRequests;

    if (!allowed) {
      this.recordSecurityEvent({
        type: 'policy_violation',
        severity: 'medium',
        action: 'rate_limit_exceeded',
        details: { key, count: userRequests.count, limit: rateLimiter.maxRequests },
        blocked: true,
      });
    }

    return allowed;
  }

  /**
   * Setup session timeout
   */
  private setupSessionTimeout(config: SessionConfig): void {
    // This would integrate with your session management system
    console.log('Session timeout configured:', config);
  }

  /**
   * Setup IP whitelist
   */
  private setupIPWhitelist(allowedIPs: string[]): void {
    // This would typically be handled server-side
    console.log('IP whitelist configured:', allowedIPs);
  }

  /**
   * Record security event
   */
  recordSecurityEvent(eventData: Partial<SecurityEvent>): void {
    const event: SecurityEvent = {
      id: this.generateId(),
      type: eventData.type || 'suspicious_activity',
      severity: eventData.severity || 'medium',
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      resource: eventData.resource,
      action: eventData.action,
      timestamp: new Date(),
      details: eventData.details || {},
      blocked: eventData.blocked || false,
      resolved: false,
    };

    this.events.push(event);
    this.updateSecurityMetrics();

    // Send critical events immediately
    if (event.severity === 'critical') {
      this.sendSecurityAlert(event);
    }

    // Send to real-time monitoring
    if (socketManager.isConnected) {
      socketManager.emit('security:event', event);
    }

    console.log(`🔒 Security event recorded: ${event.type} - ${event.severity}`);
  }

  /**
   * Detect suspicious patterns
   */
  private detectSuspiciousPatterns(): void {
    const recentEvents = this.events.filter(
      event => Date.now() - event.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    // Detect multiple failed login attempts
    const failedLogins = recentEvents.filter(
      event => event.type === 'authentication' && event.action === 'login_failed'
    );

    if (failedLogins.length >= 5) {
      const ipAddresses = [...new Set(failedLogins.map(event => event.ipAddress))];
      ipAddresses.forEach(ip => {
        if (ip) {
          this.suspiciousIPs.add(ip);
          this.recordSecurityEvent({
            type: 'suspicious_activity',
            severity: 'high',
            action: 'multiple_failed_logins',
            details: { ipAddress: ip, attempts: failedLogins.length },
            blocked: true,
          });
        }
      });
    }

    // Detect unusual data access patterns
    const dataAccessEvents = recentEvents.filter(
      event => event.type === 'data_access'
    );

    const accessByUser = new Map<string, number>();
    dataAccessEvents.forEach(event => {
      if (event.userId) {
        accessByUser.set(event.userId, (accessByUser.get(event.userId) || 0) + 1);
      }
    });

    accessByUser.forEach((count, userId) => {
      if (count > 100) { // More than 100 data access events in 5 minutes
        this.recordSecurityEvent({
          type: 'suspicious_activity',
          severity: 'medium',
          action: 'excessive_data_access',
          details: { userId, accessCount: count },
          blocked: false,
        });
      }
    });
  }

  /**
   * Update security metrics
   */
  private updateSecurityMetrics(): void {
    const now = Date.now();
    const last24Hours = this.events.filter(
      event => now - event.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    this.securityMetrics = {
      totalEvents: this.events.length,
      blockedAttempts: this.events.filter(event => event.blocked).length,
      suspiciousActivities: this.events.filter(event => event.type === 'suspicious_activity').length,
      policyViolations: this.events.filter(event => event.type === 'policy_violation').length,
      activeThreats: this.suspiciousIPs.size + this.blockedIPs.size,
      riskScore: this.calculateRiskScore(last24Hours),
      lastIncident: last24Hours.find(event => event.severity === 'critical')?.timestamp,
    };
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(events: SecurityEvent[]): number {
    let score = 0;

    events.forEach(event => {
      switch (event.severity) {
        case 'low':
          score += 1;
          break;
        case 'medium':
          score += 3;
          break;
        case 'high':
          score += 7;
          break;
        case 'critical':
          score += 15;
          break;
      }
    });

    // Normalize to 0-100 scale
    return Math.min(100, Math.round(score / 10));
  }

  /**
   * Check session timeouts
   */
  private checkSessionTimeouts(): void {
    const sessionPolicy = this.policies.get('session-timeout');
    if (!sessionPolicy || !sessionPolicy.enabled) return;

    const config = sessionPolicy.config as SessionConfig;
    const now = Date.now();

    this.activeSessions.forEach((session, sessionId) => {
      const isExpired = now - session.lastActivity > config.idleTimeout;
      const isMaxAge = now - session.createdAt > config.maxAge;

      if (isExpired || isMaxAge) {
        this.terminateSession(sessionId, isMaxAge ? 'max_age' : 'idle_timeout');
      }
    });
  }

  /**
   * Terminate session
   */
  private terminateSession(sessionId: string, reason: string): void {
    this.activeSessions.delete(sessionId);
    
    this.recordSecurityEvent({
      type: 'authentication',
      severity: 'low',
      action: 'session_terminated',
      details: { sessionId, reason },
      blocked: false,
    });

    // Notify user
    document.dispatchEvent(new CustomEvent('auth:session_terminated', {
      detail: { sessionId, reason }
    }));
  }

  /**
   * Send security alert
   */
  private sendSecurityAlert(event: SecurityEvent): void {
    // Send to monitoring system
    fetch('/api/security/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(error => {
      console.error('Failed to send security alert:', error);
    });

    // Send real-time notification
    if (socketManager.isConnected) {
      socketManager.emit('security:alert', event);
    }
  }

  /**
   * Report security metrics
   */
  private reportSecurityMetrics(): void {
    fetch('/api/security/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: this.securityMetrics,
        timestamp: new Date(),
      }),
    }).catch(error => {
      console.error('Failed to report security metrics:', error);
    });
  }

  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    this.events = this.events.filter(event => event.timestamp.getTime() > cutoff);
  }

  /**
   * Validate password against policy
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const policy = this.policies.get('password-policy');
    if (!policy || !policy.enabled) {
      return { valid: true, errors: [] };
    }

    const config = policy.config;
    const errors: string[] = [];

    if (password.length < config.minLength) {
      errors.push(`Password must be at least ${config.minLength} characters long`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Block IP address
   */
  blockIP(ipAddress: string, reason: string): void {
    this.blockedIPs.add(ipAddress);
    
    this.recordSecurityEvent({
      type: 'authorization',
      severity: 'high',
      action: 'ip_blocked',
      details: { ipAddress, reason },
      blocked: true,
    });
  }

  /**
   * Unblock IP address
   */
  unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress);
    this.suspiciousIPs.delete(ipAddress);
    
    this.recordSecurityEvent({
      type: 'authorization',
      severity: 'low',
      action: 'ip_unblocked',
      details: { ipAddress },
      blocked: false,
    });
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics };
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get security policies
   */
  getPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Utility methods
   */
  private getCurrentUserId(): string {
    return localStorage.getItem('user_id') || 'anonymous';
  }

  private getSessionId(): string {
    return sessionStorage.getItem('session_id') || 'unknown';
  }

  private getClientIP(): string {
    // This would typically be provided by the server
    return 'unknown';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();

// Export types
export type {
  SecurityEvent,
  SecurityPolicy,
  SecurityMetrics,
  RateLimitConfig,
  SessionConfig,
};
