export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    actionId?: string;
    recoverable: boolean;
    recommendedAction: string;
    moneyCharged: number;
  };
}

export function createStructuredError(params: {
  code: string;
  message: string;
  actionId?: string;
  recoverable?: boolean;
  recommendedAction?: string;
  moneyCharged?: number;
}): StandardErrorResponse {
  return {
    error: {
      code: params.code,
      message: params.message,
      actionId: params.actionId,
      recoverable: params.recoverable !== undefined ? params.recoverable : true,
      recommendedAction: params.recommendedAction || 'CONTACT_SUPPORT_OR_RETRY',
      moneyCharged: params.moneyCharged || 0,
    },
  };
}
