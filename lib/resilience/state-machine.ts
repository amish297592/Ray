export type TransactionState =
  | 'CREATED'
  | 'POLICY_CHECKED'
  | 'AWAITING_AUTHORIZATION'
  | 'AUTHORIZED'
  | 'ORDER_CREATION_PENDING'
  | 'ORDER_CREATED'
  | 'CHECKOUT_STARTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_VERIFIED'
  | 'COMPLETED'
  // Failure / Recovery States
  | 'POLICY_REJECTED'
  | 'AUTHORIZATION_DENIED'
  | 'ORDER_CREATION_FAILED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_TIMEOUT'
  | 'SIGNATURE_INVALID'
  | 'DUPLICATE_REQUEST'
  | 'LIMIT_EXCEEDED'
  | 'RECOVERY_REQUIRED';

export interface StateTransitionResult {
  valid: boolean;
  fromState: TransactionState;
  toState: TransactionState;
  reason?: string;
}

// Allowed Valid State Transitions Map
const VALID_TRANSITIONS: Record<TransactionState, TransactionState[]> = {
  CREATED: ['POLICY_CHECKED', 'POLICY_REJECTED', 'LIMIT_EXCEEDED', 'DUPLICATE_REQUEST'],
  POLICY_CHECKED: ['AWAITING_AUTHORIZATION', 'POLICY_REJECTED', 'AUTHORIZATION_DENIED'],
  AWAITING_AUTHORIZATION: ['AUTHORIZED', 'AUTHORIZATION_DENIED', 'RECOVERY_REQUIRED'],
  AUTHORIZED: ['ORDER_CREATION_PENDING', 'ORDER_CREATION_FAILED', 'RECOVERY_REQUIRED'],
  ORDER_CREATION_PENDING: ['ORDER_CREATED', 'ORDER_CREATION_FAILED'],
  ORDER_CREATED: ['CHECKOUT_STARTED', 'ORDER_CREATION_FAILED'],
  CHECKOUT_STARTED: ['PAYMENT_PENDING', 'PAYMENT_FAILED', 'PAYMENT_TIMEOUT'],
  PAYMENT_PENDING: ['PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_TIMEOUT'],
  PAYMENT_RECEIVED: ['PAYMENT_VERIFIED', 'SIGNATURE_INVALID', 'PAYMENT_FAILED'],
  PAYMENT_VERIFIED: ['COMPLETED'],
  COMPLETED: [],

  // Terminal Failure / Recovery States
  POLICY_REJECTED: ['CREATED', 'AWAITING_AUTHORIZATION'],
  AUTHORIZATION_DENIED: ['AWAITING_AUTHORIZATION'],
  ORDER_CREATION_FAILED: ['ORDER_CREATION_PENDING', 'RECOVERY_REQUIRED'],
  PAYMENT_FAILED: ['CHECKOUT_STARTED', 'RECOVERY_REQUIRED'],
  PAYMENT_TIMEOUT: ['PAYMENT_PENDING', 'PAYMENT_VERIFIED', 'RECOVERY_REQUIRED'],
  SIGNATURE_INVALID: ['RECOVERY_REQUIRED'],
  DUPLICATE_REQUEST: [],
  LIMIT_EXCEEDED: ['CREATED'],
  RECOVERY_REQUIRED: ['CREATED', 'CHECKOUT_STARTED'],
};

/**
 * Validates and executes a transaction state transition
 */
export function transitionTransactionState(
  fromState: TransactionState,
  toState: TransactionState
): StateTransitionResult {
  const allowed = VALID_TRANSITIONS[fromState] || [];

  if (allowed.includes(toState)) {
    return {
      valid: true,
      fromState,
      toState,
      reason: `Valid transition from ${fromState} to ${toState}`,
    };
  }

  return {
    valid: false,
    fromState,
    toState,
    reason: `Invalid State Transition Attempted: Cannot transition from '${fromState}' directly to '${toState}'.`,
  };
}
